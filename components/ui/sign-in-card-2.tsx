'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, User } from 'lucide-react';
import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Light theme input styles
        "file:text-foreground placeholder:text-slate-400 selection:bg-brand-100 selection:text-brand-900 border-slate-200 flex h-9 w-full min-w-0 rounded-md border bg-slate-50 px-3 py-1 text-base shadow-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-slate-900",
        "focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

interface SignInCardProps {
  onSignInSuccess: () => void;
}

export function SignInCard({ onSignInSuccess }: SignInCardProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login/signup delay
    setTimeout(() => {
      setIsLoading(false);
      onSignInSuccess();
    }, 1500);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset form fields slightly on toggle for cleaner UX
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 relative overflow-hidden flex items-center justify-center font-sans">

      {/* Background gradient effect - Blue theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-blue-50" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top radial glow - Blue */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-brand-200/40 blur-[80px]" />

      {/* Floating abstract shapes */}
      <motion.div
        className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-blue-100/50 mix-blend-multiply blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full bg-brand-100/50 mix-blend-multiply blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 5 }}
        >
          <div className="relative group">
            {/* Card Shadow/Glow - Blue */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 10px 40px -10px rgba(37, 99, 235, 0.1)",
                  "0 10px 50px -10px rgba(37, 99, 235, 0.2)",
                  "0 10px 40px -10px rgba(37, 99, 235, 0.1)"
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror"
              }}
            />

            {/* Card Container - White Glass */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden">

              {/* Decoration Border Line top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />

              {/* Logo and header */}
              <div className="text-center space-y-2 mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center relative shadow-sm border border-brand-100"
                >
                  <ShieldAlert className="w-7 h-7" />
                </motion.div>

                <motion.h1
                  key={isSignUp ? "signup-title" : "signin-title"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-slate-900"
                >
                  {isSignUp ? "Create Account" : "Insurelp"}
                </motion.h1>

                <motion.p
                  key={isSignUp ? "signup-desc" : "signin-desc"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-500 text-sm"
                >
                  {isSignUp ? "Start your claim appeal today" : "Secure login for claim analysis"}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">

                  {/* Name Input (Sign Up Only) */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`relative group/input mb-4`}>
                          <div className="relative flex items-center">
                            <User className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "name" ? 'text-brand-600' : 'text-slate-400'
                              }`} />
                            <Input
                              type="text"
                              placeholder="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              onFocus={() => setFocusedInput("name")}
                              onBlur={() => setFocusedInput(null)}
                              className="pl-10"
                              required={isSignUp}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email input */}
                  <motion.div
                    className={`relative group/input`}
                    whileFocus={{ scale: 1.01 }}
                  >
                    <div className="relative flex items-center">
                      <Mail className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "email" ? 'text-brand-600' : 'text-slate-400'
                        }`} />

                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password input */}
                  <motion.div
                    className={`relative group/input`}
                    whileFocus={{ scale: 1.01 }}
                  >
                    <div className="relative flex items-center">
                      <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "password" ? 'text-brand-600' : 'text-slate-400'
                        }`} />

                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10 pr-10"
                        required
                      />

                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 cursor-pointer p-1"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-slate-400 hover:text-brand-600 transition-colors" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400 hover:text-brand-600 transition-colors" />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Confirm Password (Sign Up Only) */}
                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`relative group/input mt-4`}>
                          <div className="relative flex items-center">
                            <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "confirmPassword" ? 'text-brand-600' : 'text-slate-400'
                              }`} />
                            <Input
                              type="password"
                              placeholder="Confirm Password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onFocus={() => setFocusedInput("confirmPassword")}
                              onBlur={() => setFocusedInput(null)}
                              className="pl-10"
                              required={isSignUp}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Options: Remember Me / Forgot Password - Only for Sign In */}
                <AnimatePresence>
                  {!isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                          <label htmlFor="remember-me" className="text-xs text-slate-600 cursor-pointer select-none">
                            Remember me
                          </label>
                        </div>

                        <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors" onClick={(e) => e.preventDefault()}>
                          Forgot password?
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group/button overflow-hidden rounded-lg shadow-md shadow-brand-500/20"
                >
                  <div className="relative bg-brand-600 hover:bg-brand-700 text-white font-medium h-11 transition-colors duration-300 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key={isSignUp ? "signup-btn" : "signin-btn"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          {isSignUp ? "Sign Up" : "Sign In"}
                          <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Toggle Mode */}
                <p className="text-center text-xs text-slate-500 mt-6">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); toggleMode(); }}
                    className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </a>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}