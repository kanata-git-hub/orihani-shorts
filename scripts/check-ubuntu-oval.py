"""Gate the release image on Canonical's OCI OVAL results and a known-old manifest."""
from collections import Counter
from pathlib import Path
import os
import xml.etree.ElementTree as ET

NAMESPACE = "oval:com.ubuntu.stonking:def:"
SEVERITIES = {"critical", "high", "medium", "low", "negligible", "untriaged", "unknown"}


def evaluate(feed, result, kind):
    root = ET.parse(feed).getroot()
    generator = root.find("{*}generator")
    if (generator is None or generator.findtext("{*}product_name") != "Canonical OVAL Generator"
            or not generator.findtext("{*}product_version")):
        raise SystemExit(f"Missing Canonical generator identity in {feed}")
    definitions = {}
    expected_class = "patch" if feed == "usn.xml" else "vulnerability"
    for node in root.findall("./{*}definitions/{*}definition"):
        key = node.get("id", "")
        platforms = {el.text for el in node.findall("./{*}metadata/{*}affected/{*}platform")}
        if (not key.startswith(NAMESPACE) or key in definitions or platforms != {"Ubuntu 26.10"}
                or node.get("class") != expected_class):
            raise SystemExit(f"Unexpected definition, class or Ubuntu release in {feed}")
        definitions[key] = node
    if not definitions:
        raise SystemExit(f"No Canonical Stonking definitions in {feed}")
    states = Counter()
    findings = Counter()
    seen = set()
    for row in ET.parse(result).getroot().findall(".//{*}definition"):
        key = row.get("definition_id")
        if not key:
            continue
        if key not in definitions or key in seen:
            raise SystemExit(f"Unexpected or duplicated OVAL definition in {result}")
        seen.add(key)
        state = row.get("result")
        states[state] += 1
        if state != "true":
            continue
        severity = definitions[key].findtext(".//{*}severity", default="unknown").lower()
        if severity in ("", "none"):
            severity = "unknown"
        if severity not in SEVERITIES:
            raise SystemExit(f"Unknown OVAL severity in {result}")
        findings[severity] += 1
    if seen != set(definitions):
        raise SystemExit(f"Incomplete definition coverage in {result}")
    line = f"{kind}: {len(seen)} definitions, states {dict(states)}, applicable by vendor severity {dict(findings)}"
    print(line)
    with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as out:
        print(f"- {line}", file=out)
    if set(states) - {"true", "false"}:
        raise SystemExit(f"Inconclusive OVAL outcomes for {kind}")
    return findings


usns = evaluate("usn.xml", "usn-result.xml", "Stonking security notices")
cves = evaluate("cve.xml", "cve-result.xml", "Stonking vulnerabilities")
control = evaluate("usn.xml", "control-result.xml", "Old-version positive control")
if sum(control.values()) <= sum(usns.values()):
    raise SystemExit("Changing installed versions to an old baseline did not trigger additional security notices")
if usns or any(cves[s] for s in ("critical", "high", "unknown", "untriaged")):
    raise SystemExit("Applicable vendor notices, high/critical or unclassified CVEs need review")
