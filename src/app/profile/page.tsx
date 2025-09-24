"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import { GetAdminById, UpdateProfile, Admin } from "@/services/AdminService";
import { Toast } from "@/components/ui/Toast";
import { getAdminProfile } from "@/lib/utils";
import Image from "next/image";

const Page = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [profile, setProfile] = useState<Admin | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    Toast({ message, type });
  };

  const storedAdmin =
    typeof window !== "undefined" ? localStorage.getItem("adminUser") : null;
  const parsedAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;

  const fetchProfile = useCallback(async () => {
    if (!parsedAdmin?._id) return;
    setIsLoading(true);
    try {
      const response = await GetAdminById(parsedAdmin._id);
      if (response.statusCode === 200) {
        setProfile(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || "",
          avatar: response.data.avatar || "",
        });
      } else {
        showToast("Failed to fetch profile", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch profile", "error");
    } finally {
      setIsLoading(false);
    }
  }, [parsedAdmin?._id]);

  useEffect(() => {
    if (parsedAdmin?._id) fetchProfile();
  }, [fetchProfile, parsedAdmin?._id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: "" }); // clear error on change
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdate = async () => {
    if (!parsedAdmin?._id) return;
    const errors: any = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.phone) errors.phone = "Phone is required";
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await UpdateProfile(
        {
          id: parsedAdmin._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        selectedFile || undefined,
      );

      if (response.statusCode === 200) {
        setProfile(response.data);
        showToast("Profile updated successfully", "success");
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || "",
          avatar: response.data.avatar || "",
        });
        setIsEditing(false);
        setSelectedFile(null);
        setPreview(null);
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordErrors({ ...passwordErrors, [e.target.name]: "" });
  };

  const handlePasswordSubmit = async () => {
    const errors: any = {};
    if (!passwordData.oldPassword)
      errors.oldPassword = "Old password is required";
    if (!passwordData.newPassword)
      errors.newPassword = "New password is required";
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await UpdateProfile({
        id: parsedAdmin?._id,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.statusCode === 200) {
        showToast("Password changed successfully", "success");
        setPasswordData({ oldPassword: "", newPassword: "" });
        setIsChangingPassword(false);
      } else {
        setPasswordErrors({
          ...errors,
          oldPassword: "Failed to change password",
        });
      }
    } catch (error: any) {
      console.error(error);
      setPasswordErrors({
        oldPassword:
          error.response?.data?.message || "Failed to change password",
        newPassword: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex px-4 py-8">
      {isLoading ? (
        <div className="flex h-96 w-full items-center justify-center rounded bg-white">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          {isEditing ? (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                Update Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <FormLabel label="Name" required />
                  <TextField
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <FormLabel label="Email" required />
                  <TextField
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <FormLabel label="Phone" required />
                  <TextField
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <FormLabel label="Avatar" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700"
                  />
                  {(preview || formData.avatar) && (
                    <Image
                      src={preview || `${getAdminProfile(formData.avatar)}`}
                      alt="avatar"
                      width={48}
                      height={48}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    color="primary"
                    onClick={handleUpdate}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : isChangingPassword ? (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <FormLabel label="Old Password" required />
                  <TextField
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                  />
                  {passwordErrors.oldPassword && (
                    <p className="text-sm text-red-600">
                      {passwordErrors.oldPassword}
                    </p>
                  )}
                </div>
                <div>
                  <FormLabel label="New Password" required />
                  <TextField
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    color="primary"
                    onClick={handlePasswordSubmit}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsChangingPassword(false)}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            profile && (
              <div className="flex flex-col gap-6">
                {profile.avatar && (
                  <Image
                    src={`${getAdminProfile(profile.avatar)}`}
                    alt="avatar"
                    width={48}
                    height={48}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                )}
                <div className="w-full space-y-3">
                  <h1 className="break-words text-3xl font-bold">
                    {profile.name}
                  </h1>
                  <div className="mt-4 space-y-1 break-words text-base text-gray-700">
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {profile.email}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {profile.phone}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                    <Button color="primary" onClick={() => setIsEditing(true)}>
                      Update Profile
                    </Button>
                    <Button
                      color="primary"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
