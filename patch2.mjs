import fs from 'fs';
let code = fs.readFileSync('src/components/WorkboardContent.tsx', 'utf8');

code = code.replace(
  "  const [copiedClipIndex, setCopiedClipIndex] = useState<number | null>(null);",
  "  const [copiedClipIndex, setCopiedClipIndex] = useState<number | null>(null);\n  const [activeClipIndex, setActiveClipIndex] = useState(0);"
);

code = code.replace(
  /\{\/\* Bottom: Clip-by-clip Card List \*\/\}.*?\{\/\* Video Prompt Area \*\/\}/s,
  `{/* Bottom: Clip-by-clip Card List */}
          {activeTab === 'prompts' && clips.length > 0 && (
             <div className="flex flex-col gap-4">
               <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
                 {clips.map((clip, idx) => (
                   <button
                     key={idx}
                     onClick={() => setActiveClipIndex(idx)}
                     className={\`px-4 py-2 font-bold text-xs uppercase border-2 transition-colors shrink-0 \${activeClipIndex === idx ? 'bg-[#552c24] border-[#552c24] text-[#ffcd4a] shadow-[2px_2px_0px_#ffcd4a]' : 'bg-[#f9f7f4] border-[#552c24] text-[#552c24] opacity-70 hover:opacity-100'}\`}
                   >
                     CLIP \${idx + 1}
                   </button>
                 ))}
               </div>
               
               {clips[activeClipIndex] && (() => {
                  const clip = clips[activeClipIndex];
                  const idx = activeClipIndex;
                  return (
                  <div className="bg-[#ffffff] border-2 border-[#552c24] p-4 flex flex-col gap-3 relative shadow-[4px_4px_0px_#552c24] max-w-md w-full self-center">
                    <div className="font-bold text-sm uppercase text-[#552c24] border-b border-[#552c24]/10 pb-2">
                      {clip.title}
                    </div>

                    {/* Image Generation Area */}
                    {!sceneImages[clip.imageTitle] ? (
                      <button 
                        onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, currentScenes, result)}
                        disabled={generatingImages[clip.imageTitle] || isGenerating || !clip.imagePrompt}
                        className="w-full bg-[#f9f7f4] border-2 border-dashed border-[#552c24]/20 text-[#552c24] hover:border-[#552c24] hover:bg-[#ffcd4a]/20 transition-all py-8 flex flex-col items-center justify-center gap-2 text-xs font-bold uppercase disabled:opacity-50 min-h-[160px] rounded"
                      >
                        {generatingImages[clip.imageTitle] ? (
                          <><Loader2 size={24} className="animate-spin" /> Generating Image...</>
                        ) : (
                          <><ImageIcon size={24} className="opacity-50" /> Generate Start Frame</>
                        )}
                      </button>
                    ) : (
                      <div className="relative group">
                        <img src={sceneImages[clip.imageTitle]} alt={clip.imageTitle} className="w-full object-cover rounded aspect-[9/16] bg-gray-100 border-2 border-[#552c24]" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={sceneImages[clip.imageTitle]} download={\`\${clip.imageTitle}.png\`} className="p-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a]">
                            <Download size={14} />
                          </a>
                          <button onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, currentScenes, result)} className="p-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a]">
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Video Prompt Area */}`
);

code = code.replace(
  `                    </button>
                  </div>
               ))}
             </div>
          )}
        </div>
      )}
    </>
  );
}`,
  `                    </button>
                  </div>
                  );
               })()}
             </div>
          )}
        </div>
      )}
    </>
  );
}`
);

fs.writeFileSync('src/components/WorkboardContent.tsx', code);
