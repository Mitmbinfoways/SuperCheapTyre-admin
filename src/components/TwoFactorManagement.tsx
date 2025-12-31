import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "./ui/Button";
import TextField from "./ui/TextField";
import { setup2FA, verify2FASetup, disable2FA } from "@/services/TwoFactorService";
import { Toast } from "./ui/Toast";
import CommonDialog from "./ui/Dialogbox";

interface TwoFactorManagementProps {
    isEnabled: boolean;
    onUpdate: () => void;
}

export default function TwoFactorManagement({ isEnabled, onUpdate }: TwoFactorManagementProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [qrData, setQrData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [otp, setOtp] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    const [isDisableOpen, setIsDisableOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");

    const handleStartSetup = async () => {
        setIsLoading(true);
        try {
            const response = await setup2FA();
            // qrCode is data url from backend
            setQrData({
                secret: response.data.secret,
                qrCode: response.data.qrCode // Backend generates data url or simple string? My backend: QRCode.toDataURL -> returns data:image/png;base64...
            });
            setIsSetupOpen(true);
        } catch (error: any) {
            Toast({ message: "Failed to initiate 2FA setup", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySetup = async () => {
        if (!otp || otp.length < 6) return;
        setIsLoading(true);
        try {
            const response = await verify2FASetup(otp);
            if (response.data?.backupCodes) {
                setBackupCodes(response.data.backupCodes);
                Toast({ message: "2FA Enabled Successfully", type: "success" });
                onUpdate();
            }
        } catch (error: any) {
            Toast({ message: error.response?.data?.message || "Verification failed", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!disablePassword) return;
        setIsLoading(true);
        try {
            await disable2FA(disablePassword);
            Toast({ message: "2FA Disabled Successfully", type: "success" });
            setIsDisableOpen(false);
            setDisablePassword("");
            onUpdate();
        } catch (error: any) {
            Toast({ message: error.response?.data?.message || "Failed to disable 2FA", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const closeSetup = () => {
        setIsSetupOpen(false);
        setQrData(null);
        setOtp("");
        setBackupCodes(null);
    };

    return (
        <div className="rounded-xl p-6 shadow bg-white dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                Two-Factor Authentication
            </h2>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                        Status: <span className={isEnabled ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                            {isEnabled ? "Enabled" : "Disabled"}
                        </span>
                    </span>

                    {!isEnabled ? (
                        <Button onClick={handleStartSetup}>
                            {isLoading ? "Loading..." : "Enable 2FA"}
                        </Button>
                    ) : (
                        <Button color="red" onClick={() => setIsDisableOpen(true)}>
                            Disable 2FA
                        </Button>
                    )}
                </div>

                {/* Setup Dialog */}
                <CommonDialog
                    isOpen={isSetupOpen}
                    onClose={closeSetup}
                    title="Setup Two-Factor Authentication"
                    size="lg"
                >
                    <div className="space-y-6 p-2">
                        {!backupCodes ? (
                            <>
                                {qrData && (
                                    <div className="flex flex-col items-center gap-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </p>
                                        <div className="p-4 bg-white rounded-lg">
                                            {/* Backend sends Data URL directly, so use img tag instead of QRCodeSVG if it's already an image */}
                                            {/* Actually my backend sends data_url. So I can use <img src={qrData.qrCode} /> */}
                                            <img src={qrData.qrCode} alt="2FA QR Code" width={200} height={200} />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Secret Key: <span className="font-mono">{qrData.secret}</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Enter 6-digit Code
                                    </label>
                                    <TextField
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="text-center tracking-widest text-xl"
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button onClick={handleVerifySetup}>
                                        {isLoading ? "Verifying..." : "Verify & Enable"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                                        2FA Enabled Successfully!
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Please these backup codes in a safe place. You can use them to log in if you lose access to your authenticator app.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg font-mono text-center">
                                    {backupCodes.map(code => (
                                        <div key={code} className="py-1 px-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            {code}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={closeSetup}>Done</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CommonDialog>

                {/* Disable Dialog */}
                <CommonDialog
                    isOpen={isDisableOpen}
                    onClose={() => setIsDisableOpen(false)}
                    title="Disable Two-Factor Authentication"
                    size="md"
                >
                    <div className="space-y-4 p-2">
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to disable 2FA? This will make your account less secure.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <TextField
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button color="gray" onClick={() => setIsDisableOpen(false)}>Cancel</Button>
                            <Button color="red" onClick={handleDisable}>
                                {isLoading ? "Disabling..." : "Disable 2FA"}
                            </Button>
                        </div>
                    </div>
                </CommonDialog>

            </div>
        </div>
    );
}
