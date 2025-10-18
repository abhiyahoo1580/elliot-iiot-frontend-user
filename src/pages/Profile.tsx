import { useEffect, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useAuth } from "../hooks/useAuth";
import { useProfileInfo } from "../hooks/useProfileInfo";
import { useProfileUpdate } from "../hooks/useProfileUpdate";
import { useUpdateNotifications } from "../hooks/useUpdateNotifications";
// Validation helper
function validateProfileFields(profileData: ProfileData) {
  const errors: Record<string, string> = {};
  // Firstname: required, 2-50 letters, spaces, hyphen, apostrophe
  if (!profileData.firstName.trim()) {
    errors.firstName = "First name is required";
  } else if (!/^[A-Za-z\s\-']{2,50}$/.test(profileData.firstName.trim())) {
    errors.firstName =
      "First name must be 2-50 letters and can include spaces, hyphens, or apostrophes.";
  }
  // Lastname: required, 2-50 letters, spaces, hyphen, apostrophe
  if (!profileData.lastName.trim()) {
    errors.lastName = "Last name is required";
  } else if (!/^[A-Za-z\s\-']{2,50}$/.test(profileData.lastName.trim())) {
    errors.lastName =
      "Last name must be 2-50 letters and can include spaces, hyphens, or apostrophes.";
  }
  // Phone: required, exactly 10 digits
  // Phone: require dial_code and phone, full number must be 11-15 digits (country code + number)
  const dialDigits = profileData.dial_code
    ? String(profileData.dial_code).replace(/\D/g, "")
    : "";
  const phoneDigits = String(profileData.phone ?? "").replace(/\D/g, "");
  const fullNumber = dialDigits + phoneDigits;
  // Strict admin-style validation: require dial code and combined 11-15 digits
  if (!dialDigits) {
    errors.phone = "Country code and phone number are required";
  } else if (!phoneDigits) {
    errors.phone = "Phone number is required";
  } else if (!/^\d{11,15}$/.test(fullNumber)) {
    errors.phone =
      "Full phone number (country code + number) must be 11-15 digits";
  }
  return errors;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dial_code?: string | number;
  role: string;
  department: string;
  profileImage: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: string;
}

export default function Profile() {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { profile, fetchProfile } = useProfileInfo();
  const {
    updateNotifications,
    loading: notifLoading,
    error: notifError,
    success: notifSuccess,
  } = useUpdateNotifications();
  const {
    updateProfile,
    loading: updateLoading,
    error: updateError,
    success: updateSuccess,
  } = useProfileUpdate();

  // Default state, will be replaced by API data
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    profileImage: "",
    notifications: {
      email: true,
      push: false,
      sms: true,
    },
    theme: "light",
  });

  const [originalProfileData, setOriginalProfileData] =
    useState<ProfileData>(profileData);
  const [originalNotif, setOriginalNotif] = useState(profileData.notifications);

  useEffect(() => {
    document.title = "Profile";
  }, []);

  useEffect(() => {
    if (user?.userId) {
      fetchProfile(user.userId);
    }
  }, [user?.userId, fetchProfile]);

  useEffect(() => {
    if (profile && Array.isArray(profile) && profile.length > 0) {
      const p = profile[0];
      setProfileData({
        firstName: p.first_name || "",
        lastName: p.last_name || "",
        email: p.email_id || "",
        phone:
          typeof p.phone_number === "string"
            ? p.phone_number
            : p.phone_number
            ? String(p.phone_number)
            : "",
        dial_code: p.dial_code || "",
        role: p.role || "",
        department: p.department || "",
        profileImage:
          p.profileImage ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            (p.first_name || "") + " " + (p.last_name || "")
          )}&background=FF8C61&color=fff&size=150`,
        notifications: {
          email:
            typeof p.emailNotifications === "boolean"
              ? p.emailNotifications
              : true,
          push: false, // No push notification field in API, default to false
          sms:
            typeof p.smsNotifications === "boolean" ? p.smsNotifications : true,
        },
        theme: p.theme || "light",
      });
    }
  }, [profile]);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingNotif, setIsEditingNotif] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => {
      const updated = { ...prev, [name]: value };
      // Live validation: update errors as user types
      setFormErrors(validateProfileFields(updated));
      return updated;
    });
  };

  const handleNotificationChange = (
    type: keyof ProfileData["notifications"]
  ) => {
    setProfileData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileFields(profileData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!user?.userId) return;
    // Always send trimmed phone number
    const phoneStr = String(profileData.phone ?? "");
    const phoneTrimmed = phoneStr.replace(/\D/g, "");
    // Match admin: send numeric phone_number and forward dial_code as-is (e.g. '+91')
    await updateProfile(user.userId, {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone_number: Number(phoneTrimmed),
      dial_code: profileData.dial_code,
    });
    fetchProfile(user.userId);
    // Don't set isEditing here, wait for updateSuccess
  };

  const handleSavePreferences = async () => {
    if (!user?.userId) return;
    await updateNotifications(user.userId, {
      emailNotifications: profileData.notifications.email,
      smsNotifications: profileData.notifications.sms,
    });
    // Re-fetch profile to reflect changes
    fetchProfile(user.userId);
  };

  useEffect(() => {
    if (updateSuccess) {
      setIsEditing(false);
    }
  }, [updateSuccess]);

  const isPersonalInfoUnchanged =
    String(profileData.firstName || "").trim() ===
      String(originalProfileData.firstName || "").trim() &&
    String(profileData.lastName || "").trim() ===
      String(originalProfileData.lastName || "").trim() &&
    String(profileData.phone || "").trim() ===
      String(originalProfileData.phone || "").trim() &&
    String(profileData.dial_code || "").trim() ===
      String(originalProfileData.dial_code || "").trim();

  const isPersonalInfoEmpty =
    !String(profileData.firstName || "").trim() ||
    !String(profileData.lastName || "").trim() ||
    !String(profileData.phone || "").trim() ||
    !String(profileData.dial_code || "").trim();

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-4">
              <img
                src={profileData.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Change Photo
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    readOnly={!isEditing}
                  />
                  {formErrors.firstName && isEditing && (
                    <div className="text-red-600 text-xs mt-1">
                      {formErrors.firstName}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    readOnly={!isEditing}
                  />
                  {formErrors.lastName && isEditing && (
                    <div className="text-red-600 text-xs mt-1">
                      {formErrors.lastName}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    className="w-full border rounded-md p-2 bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <PhoneInput
                    defaultCountry="in"
                    value={
                      profileData.dial_code
                        ? `${profileData.dial_code} ${profileData.phone}`
                        : profileData.phone
                    }
                    onChange={(phone, country) => {
                      // Remove all non-digit characters
                      const digits = phone.replace(/\D/g, "");
                      const dial_code = country?.country?.dialCode
                        ? `+${country.country.dialCode}`
                        : "";
                      let number = digits;
                      if (
                        dial_code &&
                        number.startsWith(dial_code.replace("+", ""))
                      ) {
                        number = number.slice(dial_code.length - 1);
                      } else if (dial_code && number.startsWith(dial_code)) {
                        number = number.slice(dial_code.length);
                      } else if (number.length > 10) {
                        number = number.slice(-10);
                      }
                      setProfileData((prev) => ({
                        ...prev,
                        phone: number,
                        dial_code,
                      }));
                    }}
                    inputClassName="w-full border rounded-md p-2"
                    disabled={!isEditing}
                  />
                  {formErrors.phone && isEditing && (
                    <div className="text-red-600 text-xs mt-1">
                      {formErrors.phone}
                    </div>
                  )}
                </div>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  className="w-full px-6 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#FF944D]"
                  onClick={(e) => {
                    e.preventDefault();
                    setOriginalProfileData(profileData);
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#FF944D]"
                    disabled={
                      updateLoading ||
                      isPersonalInfoUnchanged ||
                      isPersonalInfoEmpty
                    }
                  >
                    {updateLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    onClick={() => {
                      setProfileData(originalProfileData); // Revert changes
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {updateSuccess && (
                <div className="text-green-600 text-sm mt-2">
                  Profile updated!
                </div>
              )}
              {updateError && (
                <div className="text-red-600 text-sm mt-2">{updateError}</div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Preferences FIRST */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Notification Preferences
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotif"
                  checked={profileData.notifications.email}
                  onChange={() => handleNotificationChange("email")}
                  className="h-4 w-4 text-orange-500"
                  disabled={!isEditingNotif}
                />
                <label htmlFor="emailNotif" className="ml-2">
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsNotif"
                  checked={profileData.notifications.sms}
                  onChange={() => handleNotificationChange("sms")}
                  className="h-4 w-4 text-orange-500"
                  disabled={!isEditingNotif}
                />
                <label htmlFor="smsNotif" className="ml-2">
                  SMS Notifications
                </label>
              </div>
            </div>
            {!isEditingNotif ? (
              <button
                type="button"
                className="mt-4 w-full px-6 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#FF944D]"
                onClick={(e) => {
                  e.preventDefault();
                  setOriginalNotif(profileData.notifications);
                  setIsEditingNotif(true);
                }}
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="flex-1 px-6 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#FF944D]"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleSavePreferences();
                    setIsEditingNotif(false);
                  }}
                  disabled={notifLoading}
                >
                  {notifLoading ? "Saving..." : "Save Preferences"}
                </button>
                <button
                  type="button"
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  onClick={() => {
                    setProfileData((prev) => ({
                      ...prev,
                      notifications: originalNotif, // Revert changes
                    }));
                    setIsEditingNotif(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {notifSuccess && (
              <div className="mt-2 text-green-600 text-sm">
                Preferences saved!
              </div>
            )}
            {notifError && (
              <div className="mt-2 text-red-600 text-sm">{notifError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
