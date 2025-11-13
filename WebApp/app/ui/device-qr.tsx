import { Dispatch, SetStateAction, useState } from "react";
import QRCode from "react-qr-code";

export default function DeviceQrKey({deviceKey, setDeviceKey}: {deviceKey: string, setDeviceKey?: Dispatch<SetStateAction<string>>}) {
  const [copied, setCopied] = useState<boolean>(false)
  
  return (
    <div className="flex flex-col">
      <div className="flex justify-center flex-col items-center gap-4 border-b border-gray-300 pb-8">
        <p className="font-bold">Your device find api key:</p>
        <p>Keep it secret</p>
        <button
          onClick={() => {
            if (!deviceKey) return;
            navigator.clipboard.writeText(deviceKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <p className="bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg cursor-pointer">
            {deviceKey}
          </p>
        </button>
        {copied && <p className="text-sm text-gray-600">Copied!</p>}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="p-6 bg-gray-100 hover:bg-gray-200 rounded-xl">
          <QRCode value={deviceKey} size={218} />
        </div>
      </div>
    </div>
  );
}
