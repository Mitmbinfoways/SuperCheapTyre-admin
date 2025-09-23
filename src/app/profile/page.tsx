"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import { HiEye, HiEyeOff } from "react-icons/hi";

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
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [apiPasswordError, setApiPasswordError] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchProfile = async () => {
      try {
        const data = {
          _id: "68c7df8bf4d25f2b6ca780a6",
          name: "John",
          email: "meet.mbinfoways@gmail.com",
          phone: "1234567890",
          avatar: "avatar-1757929355111-100105459.png",
        };
        setProfile(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    console.log("Update profile", formData);
    // Call API to update profile here
    setProfile(formData);
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = () => {
    console.log("Change password", passwordData);
    // Call API to change password here
  };

  return (
    <div className="flex px-4 py-8">
      {isLoading ? (
        <div className="w-full rounded bg-white">
          {/* <Spinner className="h-96" /> */}
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
                    error={errors.name}
                  />
                </div>
                <div>
                  <FormLabel label="Email" required />
                  <TextField
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                </div>
                <div>
                  <FormLabel label="Phone" required />
                  <TextField
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    color="primary"
                    onClick={handleUpdate}
                    className="w-full sm:w-auto"
                  >
                    Save
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
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
                    error={errors.password}
                  />
                </div>
                <div>
                  <FormLabel label="New Password" required />
                  <TextField
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={errors.newPassword}
                  />
                </div>
                {apiPasswordError && (
                  <p className="text-sm text-red-600">{apiPasswordError}</p>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    color="primary"
                    onClick={handlePasswordSubmit}
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setIsChangingPassword(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            profile && (
              <div className="flex flex-col items-center gap-6">
                {profile.avatar && (
                  <img
                    src={`/uploads/${profile.avatar}`}
                    alt="avatar"
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
