export function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className={`w-6 h-6 border-2 border-[#000000] border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}