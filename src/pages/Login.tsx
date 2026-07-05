import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function Login() {
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f5f2ed] p-4 text-[#552c24]">
      <div className="bg-white p-8 rounded-lg shadow-[8px_8px_0px_#552c24] border-2 border-[#552c24] max-w-sm w-full text-center">
        <div className="w-24 h-24 mx-auto mb-8 relative"><div className="absolute inset-0 bg-white rounded-[1.75rem] shadow-[0_15px_30px_-10px_rgba(85,44,36,0.3)"></div><img src="/icon.png" alt="Logo" className="relative w-full h-full rounded-[1.75rem] object-cover p-1 z-10" /></div>
        <h1 className="text-2xl font-black mb-2">오리쇼츠 로그인</h1>
        <p className="text-sm opacity-80 mb-6 font-bold">서비스를 이용하려면 로그인해주세요.</p>
        <button
          onClick={login}
          className="w-full bg-[#ffcd4a] hover:bg-[#e5b842] text-[#552c24] font-bold py-3 rounded-lg border-2 border-[#552c24] transition-colors shadow-[4px_4px_0px_#552c24] hover:shadow-[2px_2px_0px_#552c24] hover:translate-y-[2px] hover:translate-x-[2px]"
        >
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
