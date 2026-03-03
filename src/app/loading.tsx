export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 animate-ping rounded-full bg-blue-600"></div>
                </div>
            </div>
            <p className="mt-4 animate-pulse font-medium text-blue-600">Loading Clinic System...</p>
        </div>
    );
}
