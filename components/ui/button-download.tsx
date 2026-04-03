import React from "react"
import { Download, Loader2, CheckCircle } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

interface DownloadButtonProps {
    downloadStatus: "idle" | "downloading" | "downloaded" | "complete"
    progress: number
    onClick: () => void
    className?: string
}

export default function DownloadButton({ downloadStatus, progress, onClick, className }: DownloadButtonProps) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "rounded-md w-full md:w-48 relative overflow-hidden select-none transition-all",
                // ADAPTATION: Using brand colors instead of generic 'primary'
                downloadStatus === "downloading" && "bg-brand-100 text-brand-700 hover:bg-brand-100",
                downloadStatus !== "idle" && "pointer-events-none",
                className,
            )}
            // Ensure the button variant doesn't conflict during loading state
            variant={downloadStatus === "downloading" ? "ghost" : "default"}
        >
            {downloadStatus === "idle" && (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                </>
            )}
            {downloadStatus === "downloading" && (
                <div className="z-[5] flex items-center justify-center font-semibold">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress}%
                </div>
            )}
            {downloadStatus === "downloaded" && (
                <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-semibold">Downloaded</span>
                </>
            )}
            {downloadStatus === "complete" && (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                </>
            )}
            
            {/* Progress Bar Background */}
            {downloadStatus === "downloading" && (
                <div
                    className="absolute bottom-0 z-[3] h-full left-0 bg-brand-200/50 inset-0 transition-all duration-200 ease-in-out"
                    style={{ width: `${progress}%` }}
                />
            )}
        </Button>
    )
}