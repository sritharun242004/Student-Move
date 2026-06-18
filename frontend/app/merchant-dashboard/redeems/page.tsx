"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, Camera, CameraOff, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MerchantService, MerchantStatus } from "@/services/merchant.service";

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
      };
    };
  }
}

const SECRET_CODE_LENGTH_STORAGE_KEY = "merchantCurrentSecretCodeLength";
const UNIQUE_CODE_LENGTH = 8;
const uniqueCodeRegex = /^[a-zA-Z0-9]{8}$/;

const normalizeUniqueCode = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, UNIQUE_CODE_LENGTH);

const formatUniqueCode = (value: string) => {
  if (!value) {
    return "-";
  }

  if (value.length <= 2) {
    return value;
  }

  return `${value.slice(0, 2)}-${value.slice(2)}`;
};

interface UniqueCodeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function UniqueCodeInput({ id, value, onChange }: UniqueCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const setCharAtIndex = (index: number, char: string) => {
    const nextChars = Array.from({ length: UNIQUE_CODE_LENGTH }, (_, currentIndex) =>
      currentIndex === index ? char : value[currentIndex] || ""
    );
    onChange(normalizeUniqueCode(nextChars.join("")));
  };

  const handleCharChange = (index: number, rawValue: string) => {
    const cleanedValue = rawValue.replace(/[^a-zA-Z0-9]/g, "");

    if (!cleanedValue) {
      setCharAtIndex(index, "");
      return;
    }

    const nextChars = Array.from(
      { length: UNIQUE_CODE_LENGTH },
      (_, currentIndex) => value[currentIndex] || ""
    );
    const incomingChars = cleanedValue
      .split("")
      .slice(0, UNIQUE_CODE_LENGTH - index);

    incomingChars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });

    onChange(normalizeUniqueCode(nextChars.join("")));

    const nextFocusIndex = Math.min(
      index + incomingChars.length,
      UNIQUE_CODE_LENGTH - 1
    );
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2" role="group" aria-label="Unique code">
      <div className="flex gap-1 sm:gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Input
            key={`${id}-${index}`}
            id={index === 0 ? id : undefined}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={value[index] || ""}
            onChange={(event) => handleCharChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            autoComplete="off"
            maxLength={UNIQUE_CODE_LENGTH}
            placeholder="X"
            className="h-10 w-8 p-0 text-center text-sm font-medium uppercase sm:h-11 sm:w-11 sm:text-base"
          />
        ))}
      </div>

      <span className="text-muted-foreground font-medium">-</span>

      <div className="flex gap-1 sm:gap-2">
        {Array.from({ length: 6 }).map((_, offset) => {
          const index = offset + 2;
          return (
            <Input
              key={`${id}-${index}`}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={value[index] || ""}
              onChange={(event) => handleCharChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              autoComplete="off"
              maxLength={UNIQUE_CODE_LENGTH}
              placeholder="X"
              className="h-10 w-8 p-0 text-center text-sm font-medium uppercase sm:h-11 sm:w-11 sm:text-base"
            />
          );
        })}
      </div>
    </div>
  );
}

interface SecretCodeDigitInputProps {
  id: string;
  value: string;
  length: number;
  onChange: (value: string) => void;
}

function SecretCodeDigitInput({
  id,
  value,
  length,
  onChange,
}: SecretCodeDigitInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const setDigitAtIndex = (index: number, digit: string) => {
    const nextDigits = Array.from({ length }, (_, currentIndex) =>
      currentIndex === index ? digit : value[currentIndex] || ""
    );
    onChange(nextDigits.join("").replace(/\D/g, "").slice(0, length));
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    const cleanedValue = rawValue.replace(/\D/g, "");

    if (!cleanedValue) {
      setDigitAtIndex(index, "");
      return;
    }

    const nextDigits = Array.from({ length }, (_, currentIndex) =>
      value[currentIndex] || ""
    );
    const incomingDigits = cleanedValue.split("").slice(0, length - index);

    incomingDigits.forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });

    onChange(nextDigits.join("").slice(0, length));

    const nextFocusIndex = Math.min(index + incomingDigits.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Merchant secret code digits">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={`${id}-${index}`}
          id={index === 0 ? id : undefined}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="password"
          value={value[index] || ""}
          onChange={(event) => handleDigitChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={length}
          placeholder="0"
          className="h-11 w-11 text-center text-base font-medium"
        />
      ))}
    </div>
  );
}

export default function MerchantRedeemsPage() {
  const { data: session, status } = useSession();
  const [uniqueCode, setUniqueCode] = useState("");
  const [merchantSecretCode, setMerchantSecretCode] = useState("");
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secretCodeLength, setSecretCodeLength] = useState<4 | 6>(4);
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<null | { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> }>(null);
  const rafRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  const isMerchant = session?.role === "merchant";
  const secretCodeRegex = new RegExp(`^\\d{${secretCodeLength}}$`);
  const canValidateCode = uniqueCodeRegex.test(normalizeUniqueCode(uniqueCode));

  const stopCamera = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const scanFrame = async () => {
    if (!isCameraActive || !videoRef.current || !detectorRef.current) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState >= 2 && !isDetectingRef.current) {
      isDetectingRef.current = true;
      try {
        const codes = await detectorRef.current.detect(video);
        const detected = codes.find((item) => item?.rawValue?.trim());

        if (detected?.rawValue) {
          setUniqueCode(normalizeUniqueCode(detected.rawValue.trim()));
          toast.success("Code scanned successfully");
          stopCamera();
          return;
        }
      } catch {
        setCameraError("Scanning failed. Keep the code inside the frame and try again.");
      } finally {
        isDetectingRef.current = false;
      }
    }

    rafRef.current = window.requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    if (!window.BarcodeDetector) {
      setCameraError("QR scanner is not supported on this browser. Please enter code manually.");
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available on this device/browser.");
      return;
    }

    try {
      setCameraError("");
      setIsStartingCamera(true);

      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      rafRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Unable to access camera. Please allow camera permission and try again.");
      stopCamera();
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLength = window.localStorage.getItem(SECRET_CODE_LENGTH_STORAGE_KEY);
    setSecretCodeLength(storedLength === "6" ? 6 : 4);
  }, []);

  useEffect(() => {
    const loadMerchantStatus = async () => {
      if (!session?.access || !isMerchant) {
        return;
      }

      try {
        const response = await MerchantService.getMyStatus(session.access);
        setMerchantStatus(response);
      } catch (error) {
        console.error("Failed to load merchant status", error);
      }
    };

    loadMerchantStatus();
  }, [session?.access, isMerchant]);

  useEffect(() => {
    setMerchantSecretCode((previousValue) => previousValue.slice(0, secretCodeLength));
  }, [secretCodeLength]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const openSecretCodeDialog = () => {
    const normalizedUniqueCode = normalizeUniqueCode(uniqueCode);

    if (!uniqueCodeRegex.test(normalizedUniqueCode)) {
      toast.error("Unique code must be exactly 8 letters or numbers");
      return;
    }

    setUniqueCode(normalizedUniqueCode);
    setMerchantSecretCode("");
    setIsSecretDialogOpen(true);
  };

  const handleRedeem = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!session?.access) {
      return;
    }

    const normalizedUniqueCode = normalizeUniqueCode(uniqueCode);

    if (!uniqueCodeRegex.test(normalizedUniqueCode)) {
      toast.error("Unique code must be exactly 8 letters or numbers");
      return;
    }

    if (!secretCodeRegex.test(merchantSecretCode)) {
      toast.error(`Merchant secret code must be exactly ${secretCodeLength} digits`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await MerchantService.validateRedemption(
        {
          uniqueCode: formatUniqueCode(normalizedUniqueCode),
          merchantSecretCode,
        },
        session.access
      );

      if (response?.success === false) {
        toast.error(response.message || "Voucher redeem failed");
        return;
      }

      toast.success(response?.message || "Voucher redeemed successfully");
      setUniqueCode("");
      setMerchantSecretCode("");
      setIsSecretDialogOpen(false);
    } catch (error: unknown) {
      const maybeAxiosError = error as {
        response?: { data?: { message?: string; error?: string } };
      };

      const message =
        maybeAxiosError?.response?.data?.message ||
        maybeAxiosError?.response?.data?.error ||
        "Unable to validate voucher";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-56">
        <p className="text-muted-foreground">Loading redeem section...</p>
      </div>
    );
  }

  if (!isMerchant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>This section is only available for merchants.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {merchantStatus?.hasSecretCode === false && (
         <Alert className="border-orange-200 bg-orange-50 text-orange-800">
            <AlertTriangle className={`h-4 w-4 text-orange-600 `} /> 
          <AlertDescription>
            Your secret code is not set. Set your secret code to enable secure voucher redemption. (Dashboard &gt; Profile)
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-2xl font-bold">Voucher Redeems</h2>
        <p className="text-muted-foreground">Enter a voucher code manually or scan it with your camera.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
        <CardHeader>
          <CardTitle>Scan Camera</CardTitle>
          <CardDescription>
            Use your device camera to scan voucher QR codes for quick redemption. Make sure to allow camera access when prompted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="rounded-md border bg-black/90 overflow-hidden">
                <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
              </div>

              {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}

              <div className="flex flex-col sm:flex-row gap-2">
                {!isCameraActive ? (
                  <Button onClick={startCamera} disabled={isStartingCamera} className="w-full sm:w-auto">
                    {isStartingCamera ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Opening camera...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={stopCamera} className="w-full sm:w-auto">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={openSecretCodeDialog}
                  disabled={submitting || !canValidateCode}
                  className="w-full sm:w-auto"
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  Redeem Scanned Code
                </Button>
              </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>
            Enter the voucher code manually to redeem it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uniqueCode">Unique Code</Label>
                <UniqueCodeInput
                  id="uniqueCode"
                  value={uniqueCode}
                  onChange={(value) => setUniqueCode(normalizeUniqueCode(value))}
                />
                <p className="text-xs text-muted-foreground">Enter the unique code for the voucher provided by the tenant/student.</p>
              </div>
              <Button
                onClick={openSecretCodeDialog}
                disabled={submitting || !canValidateCode}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Redeeming...
                  </>
                ) : (
                  "Redeem Voucher"
                )}
              </Button>          
        </CardContent>
      </Card>
      </div>

      <Dialog
        open={isSecretDialogOpen}
        onOpenChange={(open) => {
          setIsSecretDialogOpen(open);
          if (!open) {
            setMerchantSecretCode("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Merchant Secret Code</DialogTitle>
            <DialogDescription>
              Confirm voucher redemption by entering your merchant secret code.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRedeem}>
            <div className="rounded-md border p-3 bg-muted/20">
              <p className="text-sm text-muted-foreground">Unique code</p>
              <p className="font-medium tracking-wide">{formatUniqueCode(uniqueCode)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchantSecretCode">Merchant Secret Code</Label>
              <SecretCodeDigitInput
                id="merchantSecretCode"
                value={merchantSecretCode}
                onChange={setMerchantSecretCode}
                length={secretCodeLength}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSecretDialogOpen(false);
                  setMerchantSecretCode("");
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !secretCodeRegex.test(merchantSecretCode)}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Redeeming...
                  </>
                ) : (
                  "Confirm Redeem"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

     
    </div>
  );
}
