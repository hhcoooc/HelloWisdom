"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, UserPlus, CheckCircle2, User, X, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import http from "@/src/lib/http";

export default function AuthPage() {
  const router = useRouter();

  // 控制是否翻转到了注册面
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isReg = window.location.search.includes("mode=register") || window.location.hash === "#register";
      if (isReg) {
        setIsFlipped(true);
      }
    }
  }, []);

  // === 登录状态 ===
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // === 注册状态 ===
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmailAddress, setRegEmailAddress] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // === 忘记密码状态 ===
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // 处理倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 关闭 Modal 时的清理
  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotCode("");
    setForgotNewPassword("");
    setForgotError("");
    setForgotSuccess(false);
    // 可选：保留倒计时，防止用户关闭再开就可以疯狂刷验证码
  };

  const handleSendCode = async () => {
    if (!forgotEmail) {
      setForgotError("请先输入您的邮箱地址");
      return;
    }
    setForgotError("");
    try {
      const res = await http.post("/users/send-reset-code", { email: forgotEmail });
      if (res.data?.code === 200 || res.data?.msg === "success") {
        setCountdown(60);
      } else {
        setForgotError(res.data?.msg || "发送验证码失败");
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.msg || err.response?.data?.message || err.message || "发送异常，请检查邮箱是否正确或后端是否运行正常");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await http.post("/users/reset-password", {
        email: forgotEmail,
        code: forgotCode,
        newPassword: forgotNewPassword,
      });

      if (res.data?.code === 200 || res.data?.msg === "success") {
        setForgotSuccess(true);
        setTimeout(() => {
          closeForgotModal();
        }, 2000);
      } else {
        setForgotError(res.data?.msg || "密码重置失败，可能是验证码错误或过期");
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.msg || err.response?.data?.message || err.message || "重置异常");
    } finally {
      setForgotLoading(false);
    }
  };

  // === 登录逻辑 ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await http.post("/users/login", {
        username: loginEmail,
        password: loginPassword,
      });

      const data = res.data;
      const token = typeof data === "string" ? data : data?.data || data?.tokenValue;
      if (token) {
        localStorage.setItem("studytoken", token);
        router.push("/blog");
      } else {
        setLoginError(data?.msg || "登录失败，未收到 Token");
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.msg || err.response?.data?.message || err.message || "网络请求异常，请检查后端服务");
    } finally {
      setLoginLoading(false);
    }
  };

  // === 注册逻辑 ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess(false);

    try {
      const res = await http.post("/users/register", {
        username: regEmail,
        password: regPassword,
        email: regEmailAddress,
      });

      const data = res.data;
      // 假设后端操作成功返回 code: 200 或 success
      if (data?.code === 200 || data === "注册成功" || data?.msg === "success" || data?.msg === "注册成功") {
        setRegSuccess(true);
        // 自动填充登录框并翻转回去
        setTimeout(() => {
          setLoginEmail(regEmail);
          setLoginPassword(regPassword);
          setIsFlipped(false);
          setRegSuccess(false);
          setRegEmail("");
          setRegPassword("");
        }, 1500);
      } else {
        setRegError(data?.msg || "注册失败，请检查或更换账号");
      }
    } catch (err: any) {
      setRegError(err.response?.data?.msg || err.response?.data?.message || err.message || "注册异常，检查后端服务是否可用");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* 极简背景氛围圆斑 */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-sm h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ transform: isFlipped ? "translateX(-80%)" : "translateX(-50%)" }}
      ></div>
      <div
        className="absolute top-1/3 left-1/2 w-full max-w-sm h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ transform: isFlipped ? "translateX(-20%)" : "translateX(0)" }}
      ></div>

      <div className="relative w-full max-w-md flip-container">
        {/* flip-inner 会在 is-flipped 添加时翻转 180 度 */}
        <div className={`flip-inner ${isFlipped ? "is-flipped" : ""}`}>
          
          {/* ================== FRONT FACE: 登录视图 ================== */}
          <div className="flip-front bg-white dark:bg-[#11141a] px-8 py-10 shadow-2xl ring-1 ring-zinc-900/5 sm:rounded-3xl dark:ring-white/10 backdrop-blur-sm flex flex-col justify-center">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Back</h1>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">登入您的控制台，开始创作吧</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="login-email">登录账号</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-3 pl-11 pr-4 text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none sm:text-sm transition-colors"
                    placeholder="用户名 或 邮箱"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="login-password">密码</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-3 pl-11 pr-11 text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {loginError && <div className="text-sm text-red-500 font-medium text-center">{loginError}</div>}

              <button
                type="submit"
                disabled={loginLoading}
                className="group flex w-full justify-center items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-3.5 text-sm font-bold text-white dark:text-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {loginLoading ? (
                  <span className="animate-pulse">验证中...</span>
                ) : (
                  <>
                    登录
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-500">
              还没有账号？{" "}
              <button
                onClick={() => setIsFlipped(true)}
                type="button"
                className="font-semibold text-zinc-900 dark:text-white hover:underline transition-colors"
              >
                立即注册
              </button>
            </div>
          </div>

          {/* ================== BACK FACE: 注册视图 ================== */}
          <div className="flip-back bg-white dark:bg-[#11141a] px-8 py-10 shadow-2xl ring-1 ring-zinc-900/5 sm:rounded-3xl dark:ring-white/10 backdrop-blur-sm flex flex-col justify-center">
            <div className="text-center mb-8 relative">
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 -ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Join Us</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">创建新账号，开启您的旅程</p>
            </div>

            {regSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">账号创建成功！</h3>
                <p className="text-sm text-zinc-500">正在为您自动跳转并回填账号...</p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="reg-email">注册账号</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      id="reg-email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-3 pl-11 pr-4 text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none sm:text-sm transition-colors"
                      placeholder="自定义登录名"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="reg-email-address">邮箱地址</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      id="reg-email-address"
                      value={regEmailAddress}
                      onChange={(e) => setRegEmailAddress(e.target.value)}
                      required
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-3 pl-11 pr-4 text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none sm:text-sm transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="reg-password">设置密码</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      id="reg-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={4}
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-3 pl-11 pr-11 text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none sm:text-sm transition-colors"
                      placeholder="至少 4 位字符"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {regError && (
                  <div className="text-sm text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="group flex w-full justify-center items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-3.5 text-sm font-bold text-white dark:text-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {regLoading ? (
                    <span className="animate-pulse">创建中...</span>
                  ) : (
                    <>
                      注册
                      <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* === 忘记密码 Modal === */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-[26rem] mx-4 rounded-3xl bg-white dark:bg-[#11141a] p-8 shadow-2xl ring-1 ring-zinc-900/5 dark:ring-white/10">
            {/* 关闭按钮 */}
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">重置密码</h2>
              <p className="mt-2 text-sm text-zinc-500">通过您绑定的邮箱获取验证码，设置新密码</p>
            </div>

            {forgotSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">密码已重置！</h3>
                <p className="text-xs text-zinc-500">即将返回登录页面...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 邮箱 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="forgot-email">绑定的邮箱</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 验证码 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="forgot-code">验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="forgot-code"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      required
                      placeholder="6位数字"
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-2.5 px-3 text-sm text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || !forgotEmail}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s 后重试` : "获取验证码"}
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="forgot-new-password">新密码</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      id="forgot-new-password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      placeholder="至少 4 位字符"
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] py-2.5 pl-10 pr-10 text-sm text-black dark:text-white placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:focus:border-zinc-600 dark:focus:ring-zinc-600 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <div className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="mt-4 w-full flex justify-center items-center rounded-xl bg-black dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {forgotLoading ? "提交中..." : "保存新密码"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
