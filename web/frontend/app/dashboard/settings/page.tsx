"use client";

import React, { useEffect } from "react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Axios from "@/config/axios.config";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Loader2, XCircle, Settings, Shield, Users, UserX } from "lucide-react";

const SettingsPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [state, setState] = useState("active");
  const [userRole, setUserRole] = useState("");
  
  // Auto-approval settings
  const [autoApproval, setAutoApproval] = useState(false);
  const [autoApprovalLoading, setAutoApprovalLoading] = useState(false);

  // Landlord agent settings
  const [openForAgents, setOpenForAgents] = useState(true);
  const [openForAgentsLoading, setOpenForAgentsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [removeAgentLoading, setRemoveAgentLoading] = useState(false);

  // Fetch auto-approval setting
  const fetchAutoApprovalSetting = async () => {
    try {
      if (!session?.access) return;
      
      const response = await Axios.get(
        "/properties/settings/auto_approve_properties/",
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        setAutoApproval(response.data.data.setting_value);
      }
    } catch (error) {
      console.error("Error fetching auto-approval setting:", error);
      // Don't show error toast for missing setting, use default false
    }
  };

  // Fetch landlord settings
  const fetchLandlordSettings = async () => {
    if (!session?.access || session?.role !== "landlord") return;
    
    try {
      // Fetch open_for_agents setting from profile
      const profileResponse = await Axios.get(`/users/${session.role}/`, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });
      
      const landlordData = profileResponse.data.users?.find((user: any) => user.email === session.email);
      if (landlordData?.profile?.openForAgents !== undefined) {
        setOpenForAgents(landlordData.profile.openForAgents);
      }

      // Fetch current agent
      const agentResponse = await Axios.get("/users/profile/my-agent/", {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });
      
      if (agentResponse.data.status === "success" && agentResponse.data.data) {
        setCurrentAgent(agentResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching landlord settings:", error);
    }
  };

  // Update auto-approval setting
  const handleAutoApprovalToggle = async (checked: boolean) => {
    try {
      if (!session?.access) return;
      
      setAutoApprovalLoading(true);
      
      const response = await Axios.patch(
        "/properties/settings/auto_approve_properties/update/",
        { setting_value: checked },
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        setAutoApproval(checked);
        toast.success(
          checked 
            ? "Auto-approval enabled. New properties will be automatically approved."
            : "Auto-approval disabled. New properties will require manual approval."
        );
      }
    } catch (error: any) {
      console.error("Error updating auto-approval setting:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update auto-approval setting"
      );
    } finally {
      setAutoApprovalLoading(false);
    }
  };

  const handleOpenForAgentsToggle = async (checked: boolean) => {
    if (!session?.access) {
      toast.error("You must be logged in to update this setting");
      return;
    }

    setOpenForAgentsLoading(true);
    try {
      await Axios.patch("/users/profile/update/", {
        open_for_agents: checked
      }, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      setOpenForAgents(checked);
      toast.success(
        checked 
          ? "You are now open for agents. Approved agents can select you as their landlord."
          : "You are no longer accepting new agents."
      );
    } catch (error: any) {
      console.error("Error updating agent setting:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update agent setting"
      );
    } finally {
      setOpenForAgentsLoading(false);
    }
  };

  const handleRemoveAgent = async () => {
    if (!session?.access || !currentAgent) {
      toast.error("Unable to remove agent");
      return;
    }

    setRemoveAgentLoading(true);
    try {
      await Axios.post("/users/profile/remove-agent/", {}, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      setCurrentAgent(null);
      toast.success("Agent removed successfully");
    } catch (error: any) {
      console.error("Error removing agent:", error);
      toast.error(
        error?.response?.data?.message || "Failed to remove agent"
      );
    } finally {
      setRemoveAgentLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to update your password");
      return;
    }

    setPasswordLoading(true);

    try {
      const currentPassword = (e.target as any)["current-password"].value;
      const newPassword = (e.target as any)["new-password"].value;
      const confirmPassword = (e.target as any)["confirm-password"].value;

      // Form validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.warning("All fields are required");
        setPasswordLoading(false);
        return;
      }

      // Password requirements validation
      if (
        newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword)
      ) {
        toast.warning("Password does not meet the requirements!");
        setPasswordLoading(false);
        return;
      }

      // Password match validation
      if (newPassword !== confirmPassword) {
        toast.warning("New passwords do not match");
        setPasswordLoading(false);
        return;
      }

      const response = await Axios.patch(
        "/users/update-password-token/",
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      toast.success(
        "Password updated successfully. You will be logged out shortly."
      );

      // Reset the form
      (e.target as any)["current-password"].value = "";
      (e.target as any)["new-password"].value = "";
      (e.target as any)["confirm-password"].value = "";

      // Sign out after a short delay
      setTimeout(() => {
        signOut({ callbackUrl: "/auth/signin" });
      }, 2000);
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!session) {
      toast.error("You must be logged in to deactivate your account");
      return;
    }

    // Prevent admins from deactivating their accounts
    if (userRole === "admin") {
      toast.error("Administrator accounts cannot be deactivated");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? You will need to contact support to reactivate it."
    );

    if (confirmed) {
      setDeactivateLoading(true);

      try {
        await Axios.patch(
          "/users/deactivate/",
          {},
          {
            headers: {
              Authorization: `Bearer ${session?.access}`,
            },
          }
        );

        setState("deactivated");
        toast.success(
          "Account deactivated successfully. You will be logged out shortly."
        );

        // Sign out after a short delay
        setTimeout(() => {
          signOut({ callbackUrl: "/auth/signin" });
        }, 2000);
      } catch (error: any) {
        console.error("Deactivation error:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to deactivate account"
        );
      } finally {
        setDeactivateLoading(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setLoading(true);

    try {
      // Data validation
      if (!firstName || !lastName || !email) {
        toast.warning("All fields are required");
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.warning("Please enter a valid email address");
        setLoading(false);
        return;
      }

      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
      };

      const response = await Axios.patch("/users/profile/update/", userData, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      toast.success(
        "Profile updated successfully. You will be logged out shortly."
      );

      // Sign out after a short delay
      setTimeout(() => {
        signOut({ callbackUrl: "/auth/signin" });
      }, 2000);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      setFirstName(session.firstName || "");
      setLastName(session.lastName || "");
      setEmail(session.email || "");
      setState(session.profile?.status || "deactive");
      setUserRole(session.role || "");
      
      // Fetch auto-approval setting for admin users
      if (session.role === "admin") {
        fetchAutoApprovalSetting();
      }
      
      // Fetch landlord settings for landlord users
      if (session.role === "landlord") {
        fetchLandlordSettings();
      }
    }
  }, [status, session]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-2">Account Settings</h1>

      <div className="mb-4 flex items-center space-x-2">
        <div
          className={`h-3 w-3 rounded-full ${
            state === "active" || userRole === "admin" ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>

        <span className="text-xs font-medium text-gray-700 capitalize">
          Account Status: {userRole === "admin" ? "Active":state}
        </span>
      </div>

      {state !== "active" && userRole !== "admin" && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="text-yellow-600 h-5 w-5" />
          <p className="text-sm text-yellow-800">
            Your account is currently {state}. You will need to contact the
            StudentMoves team to reactivate your account.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700">
          General Settings
        </h2>
        <p className="text-gray-500 text-sm">
          Manage your preferences and general settings.
        </p>
      </div>

      <div className="space-y-8">
        {/* Admin Settings Section */}
        {userRole === "admin" && (
          <>
            

            <Card className="shadow-sm border-blue-100">
              <CardHeader className="bg-blue-50 flex pb-2 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Property Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="auto-approval" className="text-gray-700 font-medium">
                        Auto-approve Properties
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        When enabled, new property listings will be automatically approved instead of requiring manual review.
                      </p>
                      {autoApproval && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Properties will bypass the approval process and be immediately available to users.
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Switch
                        id="auto-approval"
                        checked={autoApproval}
                        onCheckedChange={handleAutoApprovalToggle}
                        disabled={autoApprovalLoading}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                  
                  {autoApprovalLoading && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">Updating setting...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700">
                Personal Settings
              </h2>
              <p className="text-gray-500 text-sm">
                Manage your personal profile information.
              </p>
            </div>
          </>
        )}

        {/* Landlord Settings Section */}
        {userRole === "landlord" && (
          <>
            <Card className="shadow-sm border-green-100">
              <CardHeader className="bg-green-50 flex pb-2 border-b border-green-100">
                <CardTitle className="text-green-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Agent Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="open-for-agents" className="text-gray-700 font-medium">
                        Open for Agents
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Allow approved agents to select you as their landlord and manage your properties on your behalf.
                      </p>
                      {!openForAgents && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Agents will not be able to select you when this is disabled.
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Switch
                        id="open-for-agents"
                        checked={openForAgents}
                        onCheckedChange={handleOpenForAgentsToggle}
                        disabled={openForAgentsLoading}
                        className="data-[state=checked]:bg-green-600 shadow-lg border border-black"
                      />
                    
                    </div>
                  </div>
                  
                  {openForAgentsLoading && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">Updating setting...</span>
                    </div>
                  )}

                  {/* Current Agent Section */}
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-700 mb-4">Current Agent</h3>
                    {currentAgent ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-medium text-sm">
                                {currentAgent.first_name.charAt(0)}{currentAgent.last_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-blue-800">
                                {currentAgent.first_name} {currentAgent.last_name}
                              </p>
                              <p className="text-sm text-blue-600">{currentAgent.email}</p>
                              <p className="text-xs text-blue-500">
                                Connected since {new Date(currentAgent.connected_since).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAgent}
                            disabled={removeAgentLoading}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {removeAgentLoading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Remove Agent
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">No agent currently assigned</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Agents can select you if "Open for Agents" is enabled
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700">
                Personal Settings
              </h2>
              <p className="text-gray-500 text-sm">
                Manage your personal profile information.
              </p>
            </div>
          </>
        )}

        {/* Non-landlord, Non-admin users */}
        {userRole !== "admin" && userRole !== "landlord" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700">
              Personal Settings
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your personal profile information.
            </p>
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 flex pb-2 border-b">
            <CardTitle className="text-gray-800">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
              <div>
                <Button
                  type="submit"
                  variant="outline"
                  className="cursor-pointer border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Note: You will be logged out after updating your profile
                  information.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b pb-2">
            <CardTitle className="text-gray-800">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={handlePasswordUpdate}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="col-span-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-gray-700">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type="password"
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-700">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    className="border-gray-300 focus-visible:ring-[#058DBF] focus-visible:border-[#058DBF]"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary cursor-pointer text-white"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: You will be logged out after updating your password.
                  </p>
                </div>
              </div>
              <div className="col-span-1 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 flex items-center">
                    <CheckCircle className="h-4 w-4 text-[#058DBF] mr-2" />
                    Password Requirements:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-600 inline-block mt-1.5 mr-2"></span>
                      At least 8 characters long
                    </li>
                    <li className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-600 inline-block mt-1.5 mr-2"></span>
                      Must contain at least one uppercase letter
                    </li>
                    <li className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-600 inline-block mt-1.5 mr-2"></span>
                      Must contain at least one lowercase letter
                    </li>
                    <li className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-600 inline-block mt-1.5 mr-2"></span>
                      Must contain at least one number
                    </li>
                  </ul>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mb-8 mt-12">
          <h2 className="text-xl font-semibold text-gray-700">
            Advanced Account Settings
          </h2>
          <p className="text-gray-500 text-sm">
            Control your privacy settings, including account deactivation
            options.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className=" border-b border-red-100">
            <CardTitle className="text-red-800 flex items-center pb-2">
              <XCircle className="h-5 w-5 mr-2 text-red-700" />
              Deactivate Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {userRole === "admin" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="text-blue-600 h-5 w-5" />
                  <p className="text-sm text-blue-800">
                    As an administrator, your account cannot be deactivated for
                    security reasons. This ensures continuous access to system
                    administration functions.
                  </p>
                </div>
              )}
              <p className="text-gray-600 text-sm">
                Deactivating your account will temporarily disable your account.{" "}
                <span className="text-red-500 font-semibold">
                  Once deactivated, you will need to contact StudentMoves
                  support to reactivate your account.
                </span>
              </p>
              <Button
                className="bg-red-500 hover:bg-red-600 cursor-pointer text-white"
                disabled={
                  state !== "active" ||
                  deactivateLoading ||
                  userRole === "admin"
                }
                onClick={handleDeactivate}
                title={
                  userRole === "admin"
                    ? "Administrator accounts cannot be deactivated"
                    : ""
                }
              >
                {deactivateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  "Deactivate Account"
                )}
              </Button>
              {userRole === "admin" && (
                <p className="text-xs text-orange-500 mt-2">
                  Note: Administrator accounts cannot be deactivated for
                  security reasons
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 border-t pt-6">
        <p className="text-gray-500 text-right text-xs">
          © 2025 Student Moves. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
