"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  MerchantProfile,
  MerchantService,
  MerchantStatus,
} from "@/services/merchant.service";

const SECRET_CODE_LENGTH_STORAGE_KEY = "merchantCurrentSecretCodeLength";

const resolveProfileImageUrl = (imageUrl?: string) => {
  if (!imageUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "");
  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  return gatewayUrl ? `${gatewayUrl}${normalizedPath}` : imageUrl;
};

interface ProfileFormState {
  businessName: string;
  description: string;
  address: string;
  businessEmail: string;
  phone: string;
  profileImageUrl: string;
}

interface SecretCodeDigitInputProps {
  id: string;
  value: string;
  length: number;
  onChange: (value: string) => void;
}

function SecretCodeDigitInput({ id, value, length, onChange }: SecretCodeDigitInputProps) {
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

    const nextDigits = Array.from({ length }, (_, currentIndex) => value[currentIndex] || "");
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
    <div className="flex gap-2" role="group" aria-label="Secret code digits">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={`${id}-${index}`}
          id={index === 0 ? id : undefined}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          value={value[index] || ""}
          onChange={(event) => handleDigitChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={length}
          placeholder="0"
          className="h-11 w-11 text-center text-base font-medium"
        />
      ))}
    </div>
  );
}

export default function MerchantProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    businessName: "",
    description: "",
    address: "",
    businessEmail: "",
    phone: "",
    profileImageUrl: "",
  });
  const [secretCode, setSecretCode] = useState("");
  const [previousSecretCode, setPreviousSecretCode] = useState("");
  const [currentSecretCodeLength, setCurrentSecretCodeLength] = useState<4 | 6>(4);
  const [newSecretCodeLength, setNewSecretCodeLength] = useState<4 | 6>(4);
  const [previousSecretCodeLength, setPreviousSecretCodeLength] = useState<4 | 6>(4);
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedProfileImagePreview, setSelectedProfileImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingSecretCode, setUpdatingSecretCode] = useState(false);
  const [isPreviousCodeDialogOpen, setIsPreviousCodeDialogOpen] = useState(false);

  const isMerchant = session?.role === "merchant";

  const hasSecretCode = useMemo(() => {
    if (merchantStatus?.hasSecretCode !== undefined) {
      return merchantStatus.hasSecretCode;
    }

    return Boolean(profile?.hasSecretCode);
  }, [merchantStatus?.hasSecretCode, profile?.hasSecretCode]);

  const newSecretCodeRegex = useMemo(
    () => new RegExp(`^\\d{${newSecretCodeLength}}$`),
    [newSecretCodeLength]
  );
  const previousSecretCodeRegex = useMemo(
    () => new RegExp(`^\\d{${previousSecretCodeLength}}$`),
    [previousSecretCodeLength]
  );
  const canSubmitNewSecretCode = newSecretCodeRegex.test(secretCode);
  const canConfirmSecretCodeChange =
    newSecretCodeRegex.test(secretCode) && previousSecretCodeRegex.test(previousSecretCode);

  const loadProfileData = async () => {
    if (!session?.access || !isMerchant) {
      return;
    }

    try {
      setLoading(true);
      const [profileResponse, statusResponse] = await Promise.all([
        MerchantService.getMyProfile(session.access),
        MerchantService.getMyStatus(session.access),
      ]);

      setProfile(profileResponse);
      setMerchantStatus(statusResponse);
      setProfileForm({
        businessName: profileResponse?.businessName || "",
        description: profileResponse?.description || "",
        address: profileResponse?.address || "",
        businessEmail: profileResponse?.businessEmail || "",
        phone: profileResponse?.phone || "",
        profileImageUrl: resolveProfileImageUrl(profileResponse?.profileImageUrl),
      });
    } catch (error) {
      console.error("Failed to load merchant profile", error);
      toast.error("Failed to load merchant profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.access || !isMerchant) {
      return;
    }

    loadProfileData();
  }, [session?.access, isMerchant]);

  useEffect(() => {
    if (!selectedProfileImage) {
      setSelectedProfileImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedProfileImage);
    setSelectedProfileImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedProfileImage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLength = window.localStorage.getItem(SECRET_CODE_LENGTH_STORAGE_KEY);
    const parsedLength = storedLength === "6" ? 6 : 4;
    setCurrentSecretCodeLength(parsedLength);
    setNewSecretCodeLength(parsedLength);
    setPreviousSecretCodeLength(parsedLength);
  }, []);

  useEffect(() => {
    setSecretCode((previousValue) => previousValue.slice(0, newSecretCodeLength));
  }, [newSecretCodeLength]);

  useEffect(() => {
    setPreviousSecretCode((previousValue) => previousValue.slice(0, previousSecretCodeLength));
  }, [previousSecretCodeLength]);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.access) {
      return;
    }

    try {
      setUpdatingProfile(true);

      let uploadedProfileImageUrl =
        resolveProfileImageUrl(profileForm.profileImageUrl.trim() || undefined) || undefined;

      if (selectedProfileImage) {
        const uploadResponse = await MerchantService.uploadProfileImage(
          selectedProfileImage,
          session.access
        );
        uploadedProfileImageUrl = resolveProfileImageUrl(uploadResponse.imageUrl);
      }

      const payload = {
        businessName: profileForm.businessName.trim() || undefined,
        description: profileForm.description.trim() || undefined,
        address: profileForm.address.trim() || undefined,
        businessEmail: profileForm.businessEmail.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        profileImageUrl: uploadedProfileImageUrl,
      };

      const response = await MerchantService.updateMyProfile(payload, session.access);
      setProfile({
        ...response,
        profileImageUrl:
          resolveProfileImageUrl(response?.profileImageUrl) || uploadedProfileImageUrl,
      });
      setSelectedProfileImage(null);
      setProfileForm({
        businessName: response?.businessName || "",
        description: response?.description || "",
        address: response?.address || "",
        businessEmail: response?.businessEmail || "",
        phone: response?.phone || "",
        profileImageUrl:
          resolveProfileImageUrl(response?.profileImageUrl) || uploadedProfileImageUrl || "",
      });
      toast.success(
        selectedProfileImage
          ? "Profile and image updated successfully"
          : "Profile updated successfully"
      );
    } catch (error: unknown) {
      const maybeAxiosError = error as {
        response?: { data?: { message?: string; error?: string } };
      };

      const message =
        maybeAxiosError?.response?.data?.message ||
        maybeAxiosError?.response?.data?.error ||
        "Failed to update profile";

      toast.error(message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const submitSecretCodeUpdate = async (previousSecretCodeValue?: string) => {
    if (!session?.access) {
      return;
    }

    try {
      setUpdatingSecretCode(true);
      await MerchantService.updateMySecretCode(
        {
          secretCode,
          previousSecretCode: hasSecretCode ? previousSecretCodeValue : undefined,
        },
        session.access
      );

      toast.success(hasSecretCode ? "Secret code updated" : "Secret code set");
      setSecretCode("");
      setPreviousSecretCode("");
      setCurrentSecretCodeLength(newSecretCodeLength);
      setPreviousSecretCodeLength(newSecretCodeLength);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          SECRET_CODE_LENGTH_STORAGE_KEY,
          String(newSecretCodeLength)
        );
      }
      setIsPreviousCodeDialogOpen(false);
      await loadProfileData();
    } catch (error: unknown) {
      const maybeAxiosError = error as {
        response?: { data?: { message?: string; error?: string } };
      };

      const message =
        maybeAxiosError?.response?.data?.message ||
        maybeAxiosError?.response?.data?.error ||
        "Failed to update secret code";

      toast.error(message);
    } finally {
      setUpdatingSecretCode(false);
    }
  };

  const handleSecretCodeSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmitNewSecretCode) {
      toast.error(`Secret code must be exactly ${newSecretCodeLength} digits`);
      return;
    }

    if (hasSecretCode) {
      setPreviousSecretCode("");
      setPreviousSecretCodeLength(currentSecretCodeLength);
      setIsPreviousCodeDialogOpen(true);
      return;
    }

    await submitSecretCodeUpdate();
  };

  const handleConfirmSecretCodeChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newSecretCodeRegex.test(secretCode)) {
      toast.error(`Secret code must be exactly ${newSecretCodeLength} digits`);
      return;
    }

    if (!previousSecretCodeRegex.test(previousSecretCode)) {
      toast.error(
        `Previous secret code is required and must be ${previousSecretCodeLength} digits`
      );
      return;
    }

    await submitSecretCodeUpdate(previousSecretCode);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <p className="text-muted-foreground">Loading profile...</p>
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

  const displayProfileImageUrl = selectedProfileImagePreview || profileForm.profileImageUrl;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Profile</h2>
        <p className="text-muted-foreground">Manage business details and your secret code.</p>
      </div>

      <div className="grid md:grid-cols-3 grid-col-1 gap-6">
         <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Business Information
          </CardTitle>
          <CardDescription>Update your merchant profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileSave}>

            <div className="space-y-3 rounded-md border p-4">
              <Label htmlFor="profileImage">Merchant Profile / Business Logo</Label>
              <div className="flex items-center gap-4">
                  {displayProfileImageUrl ? (
                    selectedProfileImagePreview ? (
                      <img
                        src={displayProfileImageUrl}
                        alt="Merchant profile preview"
                        className="h-32 w-32 rounded-full object-cover border"
                      />
                    ) : (
                      <Image
                        src={displayProfileImageUrl}
                        alt="Merchant profile image"
                        width={80}
                        height={80}
                        className="h-32 w-32 rounded-full object-cover border"
                      />
                    )
                ) : (
                  <div className="h-32 w-32 rounded-full border bg-muted" />
                )}
                <div className="space-y-2 w-1/2">
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedProfileImage(event.target.files?.[0] || null)}
                  />
                  <p className="text-xs  text-muted-foreground">
                    Please click "Save Profile" after selecting a new image to update your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={profileForm.businessName}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, businessName: event.target.value }))
                }
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={profileForm.description}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={4}
                placeholder="Your business description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileForm.address}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Business address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                value={profileForm.businessEmail}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, businessEmail: event.target.value }))
                }
                placeholder="business@example.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="Business phone number"
              />
            </div>

            <Button type="submit" disabled={updatingProfile}>
              {updatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Secret Code
          </CardTitle>
          <CardDescription>
            {hasSecretCode
              ? "Update your current merchant secret code."
              : "Set your merchant secret code (4 or 6 digits)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSecretCodeSave}>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Choose the length:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={newSecretCodeLength === 4 ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                  4 digits
                </span>
                <Switch
                  id="secretCodeLengthSwitch"
                  checked={newSecretCodeLength === 6}
                  onCheckedChange={(checked) => setNewSecretCodeLength(checked ? 6 : 4)}
                />
                <span className={newSecretCodeLength === 6 ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                  6 digits
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretCode">New Secret Code</Label>
              <SecretCodeDigitInput
                id="secretCode"
                value={secretCode}
                onChange={setSecretCode}
                length={newSecretCodeLength}
              />
            </div>

            {hasSecretCode && (
              <p className="text-xs text-muted-foreground">
                Enter your new secret code and click save.
                code.
              </p>
            )}

            <Button type="submit" disabled={updatingSecretCode || !canSubmitNewSecretCode}>
              {updatingSecretCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Secret Code"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Warning: Your secret code is used to authenticate redeem vouchers. Do not share it with anyone. If you believe your secret code has been compromised, change it immediately.
            </p>
          </form>

          <Dialog
            open={isPreviousCodeDialogOpen}
            onOpenChange={(open) => {
              setIsPreviousCodeDialogOpen(open);
              if (!open) {
                setPreviousSecretCode("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Secret Code Change</DialogTitle>
                <DialogDescription>
                  Enter your previous secret code and click change to update your code.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleConfirmSecretCodeChange}>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Choose the length:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        previousSecretCodeLength === 4
                          ? "text-sm font-medium"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      4 digits
                    </span>
                    <Switch
                      id="dialogSecretCodeLengthSwitch"
                      checked={previousSecretCodeLength === 6}
                      onCheckedChange={(checked) =>
                        setPreviousSecretCodeLength(checked ? 6 : 4)
                      }
                    />
                    <span
                      className={
                        previousSecretCodeLength === 6
                          ? "text-sm font-medium"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      6 digits
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousSecretCode">Previous Secret Code</Label>
                  <SecretCodeDigitInput
                    id="previousSecretCode"
                    value={previousSecretCode}
                    onChange={setPreviousSecretCode}
                    length={previousSecretCodeLength}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsPreviousCodeDialogOpen(false);
                      setPreviousSecretCode("");
                    }}
                    disabled={updatingSecretCode}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingSecretCode || !canConfirmSecretCodeChange}
                  >
                    {updatingSecretCode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Changing...
                      </>
                    ) : (
                      "Change"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      </div>

     
    </div>
  );
}
