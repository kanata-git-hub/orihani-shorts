import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface ApprovedUser {
  email: string;
  level: string;
}

export function Admin() {
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newLevel, setNewLevel] = useState('user');
  const { logout } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'approved_users'), (snapshot) => {
      const usersData: ApprovedUser[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ email: doc.id, ...doc.data() } as ApprovedUser);
      });
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    try {
      await setDoc(doc(db, 'approved_users', newEmail.trim().toLowerCase()), {
        level: newLevel
      });
      setNewEmail('');
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (confirm(`정말 ${email} 유저를 삭제하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, 'approved_users', email));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] p-6 text-[#552c24]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">관리자 대시보드</h1>
          <div className="flex gap-4">
            <a href="/" className="underline font-bold mt-2">메인으로 돌아가기</a>
            <button onClick={logout} className="bg-white px-4 py-2 border-2 border-[#552c24] rounded-lg font-bold shadow-[2px_2px_0px_#552c24]">로그아웃</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-2 border-[#552c24] shadow-[4px_4px_0px_#552c24] mb-8">
          <h2 className="text-xl font-bold mb-4">신규 회원 승인</h2>
          <form onSubmit={handleAddUser} className="flex gap-4">
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="이메일 주소" 
              className="flex-1 border-2 border-[#552c24] rounded-lg px-4 py-2"
              required
            />
            <select 
              value={newLevel} 
              onChange={(e) => setNewLevel(e.target.value)}
              className="border-2 border-[#552c24] rounded-lg px-4 py-2 font-bold"
            >
              <option value="user">일반 유저</option>
              <option value="admin">관리자</option>
            </select>
            <button type="submit" className="bg-[#ffcd4a] px-6 py-2 border-2 border-[#552c24] rounded-lg font-bold">추가</button>
          </form>
        </div>

        <div className="bg-white rounded-lg border-2 border-[#552c24] shadow-[4px_4px_0px_#552c24] overflow-hidden">
          <h2 className="text-xl font-bold p-6 border-b-2 border-[#552c24]">승인된 회원 목록</h2>
          <table className="w-full text-left">
            <thead className="bg-[#f5f2ed] border-b-2 border-[#552c24]">
              <tr>
                <th className="p-4 font-bold">이메일</th>
                <th className="p-4 font-bold">권한 레벨</th>
                <th className="p-4 font-bold text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-[#552c24]/20 last:border-0">
                  <td className="p-4">{user.email}</td>
                  <td className="p-4 uppercase font-bold">{user.level}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(user.email)}
                      className="text-red-500 font-bold hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center opacity-60">등록된 유저가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
