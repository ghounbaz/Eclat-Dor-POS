import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, Sparkles } from "lucide-react";

const Login = ({ onLogin }: { onLogin: (user: string) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // هنا تقدري تحددي المستعملين اللي بغيتي
    if ((username === "admin" && password === "123") || (username === "eclat" && password === "2026")) {
      onLogin(username);
    } else {
      alert("معلومات الدخول خاطئة!");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md rounded-[2.5rem] border-2 border-amber-100 shadow-2xl bg-white/90 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-2">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-black text-amber-900 italic">Eclat D'or</CardTitle>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest">تسجيل الدخول للنظام</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute right-3 top-3 text-amber-500 w-5 h-5" />
                <Input 
                  placeholder="إسم المستخدم" 
                  className="pr-10 h-12 rounded-xl border-amber-200" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-amber-500 w-5 h-5" />
                <Input 
                  type="password" 
                  placeholder="كلمة المرور" 
                  className="pr-10 h-12 rounded-xl border-amber-200" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xl shadow-xl mt-4">
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;