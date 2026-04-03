import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface CryptoIcon {
  icon: React.ReactNode;
  label: string;
  position: { x: string; y: string };
}

interface Web3MediaHeroProps {
  logo?: string;
  hideHeader?: boolean;
  navigation?: Array<{
    label: string;
    onClick?: () => void;
  }>;
  contactButton?: {
    label: string;
    onClick: () => void;
  };
  title: string;
  highlightedText?: string;
  subtitle: string;
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
  cryptoIcons?: CryptoIcon[];
  trustedByText?: string;
  brands?: Array<{
    name: string;
    logo: React.ReactNode;
  }>;
  className?: string;
  children?: React.ReactNode;
}

export function Web3MediaHero({
  logo = "Project N",
  hideHeader = false,
  navigation = [],
  contactButton,
  title,
  highlightedText = "Analysis",
  subtitle,
  ctaButton,
  cryptoIcons = [],
  trustedByText = "Trusted by",
  brands = [],
  className,
  children,
}: Web3MediaHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full flex flex-col overflow-hidden",
        className
      )}
      style={{
        // ADAPTATION: Changed from dark gradient to Medical Blue/White gradient
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        minHeight: "85vh" // Slightly reduced from 100vh to show content below
      }}
      role="banner"
      aria-label="Hero section"
    >
      {/* Radial Glow Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            width: "1200px",
            height: "1200px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            // ADAPTATION: Changed glow from orange to Brand Blue
            background: "radial-gradient(circle, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0) 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Header */}
      {!hideHeader && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 flex flex-row justify-between items-center px-8 lg:px-16"
          style={{
            paddingTop: "24px",
            paddingBottom: "24px",
          }}
        >
          {/* Logo */}
          <div
            className="text-slate-800"
            style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 700,
              fontSize: "20px",
            }}
          >
            <span style={{ fontWeight: 700 }}>{logo}</span>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex flex-row items-center gap-8" aria-label="Main navigation">
            {navigation.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="hover:text-brand-600 transition-colors text-slate-600"
                style={{
                  fontFamily: "Open Sans, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </motion.header>
      )}

      {/* Main Content */}
      {children ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-10">
          {/* Floating Icons */}
          {cryptoIcons.map((crypto, index) => (
            <motion.div
              key={index}
              className="absolute flex flex-col items-center gap-2 hidden md:flex cursor-default"
              style={{
                left: crypto.position.x,
                top: crypto.position.y,
              }}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{
                opacity: 1,
                scale: [1, 1.05, 1], // Subtle breathing scale
                y: [0, -15, 0], // Gentle float
              }}
              whileHover={{
                scale: 1.15,
                y: -5,
                zIndex: 50,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.2 + index * 0.1 },
                scale: { 
                  duration: 4 + index * 0.5, 
                  repeat: Infinity, 
                  repeatType: "mirror", 
                  ease: "easeInOut" 
                },
                y: {
                  duration: 5 + index * 0.5, 
                  repeat: Infinity, 
                  repeatType: "mirror", 
                  ease: "easeInOut",
                },
              }}
            >
              <div
                className="bg-white/80 backdrop-blur-md border border-brand-100 shadow-xl shadow-brand-500/10 transition-all duration-300 group relative overflow-hidden"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                 {/* Subtle animated background gradient for shine effect */}
                 <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-brand-50/40 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 />
                 
                 <motion.div
                   className="relative z-10"
                   whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                   animate={{ 
                     rotate: [0, 3, -3, 0], // Very subtle sway
                   }}
                   transition={{ 
                     rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: index },
                     scale: { duration: 0.2 }
                   }}
                 >
                   {crypto.icon}
                 </motion.div>
              </div>
              
              {/* Label with subtle pulse opacity */}
              <motion.span
                className="text-brand-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm border border-brand-50 shadow-sm"
                style={{
                  fontFamily: "Open Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, delay: index }}
              >
                {crypto.label}
              </motion.span>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center text-center max-w-4xl"
            style={{ gap: "32px" }}
          >
            {/* Logo Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-brand-600 font-bold bg-brand-50 px-4 py-1 rounded-full border border-brand-100"
              style={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}
            >
              Project-N AI Engine
            </motion.div>

            {/* Title */}
            <h1
              className="text-slate-800"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: "1.1",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
              <br />
              <span
                className="text-brand-600"
                style={{
                  fontWeight: 800,
                }}
              >
                {highlightedText}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-slate-600"
              style={{
                fontFamily: "Open Sans, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: "1.6",
                maxWidth: "600px",
              }}
            >
              {subtitle}
            </p>

            {/* CTA Button */}
            {ctaButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={ctaButton.onClick}
                className="px-10 py-4 rounded-full transition-all bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30"
                style={{
                  fontFamily: "Open Sans, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {ctaButton.label}
              </motion.button>
            )}
          </motion.div>
        </div>
      )}

      {/* Brand Slider */}
      {brands.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 w-full overflow-hidden"
          style={{
            paddingTop: "60px",
            paddingBottom: "40px",
          }}
        >
          {/* "Trusted by" Text */}
          <div className="text-center mb-8">
            <span
              className="text-slate-400"
              style={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {trustedByText}
            </span>
          </div>

          {/* Gradient Overlays */}
          <div
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "200px",
              background: "linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "200px",
              background: "linear-gradient(270deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />

          {/* Scrolling Brands */}
          <motion.div
            className="flex items-center"
            animate={{
              x: [0, -(brands.length * 200)],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: brands.length * 5,
                ease: "linear",
              },
            }}
            style={{
              gap: "80px",
              paddingLeft: "80px",
            }}
          >
            {/* Duplicate brands for seamless loop */}
            {[...brands, ...brands].map((brand, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                style={{
                  width: "120px",
                  height: "40px",
                }}
              >
                {brand.logo}
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}