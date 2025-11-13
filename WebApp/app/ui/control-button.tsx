import { Spinner } from "./spinner";

export default function ControlButton({
  onClick,
  children,
  disabled,
  loading,
  label,
  color,
  animate,
} : {
  onClick: () => void,
  children: React.ReactNode,
  disabled?: boolean,
  loading?: boolean,
  label: string,
  color?: string
  animate?: boolean
}) {

  return (
    <div className="flex flex-col items-center space-y-1">
      <button className={`rounded-full ${color ? color : 'bg-slate-100 hover:bg-slate-200'} cursor-pointer h-12 w-12 flex justify-center items-center`}
      onClick={onClick} disabled={disabled}>
        {loading ? <Spinner/> : children}
      </button>
      <p className="text-sm text-gray-600 text-center">{label}</p>
    </div>
  );
}