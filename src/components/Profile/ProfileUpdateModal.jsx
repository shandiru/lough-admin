import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, User } from 'lucide-react';
import { profileService } from '../../api/profileService';
import toast from 'react-hot-toast';


const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;                        
  return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${src}`; 
};

const ProfileUpdateModal = ({ currentUser, staffData, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName:  currentUser?.lastName  || '',
    phone:     currentUser?.phone     || '',
    bio:       staffData?.bio         || '',
  });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(getImageUrl(currentUser?.profileImage));
  const [loading, setLoading]           = useState(false);
  const fileRef = useRef();

  const isStaff = currentUser?.role === 'staff';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // local blob preview
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('firstName', form.firstName.trim());
      fd.append('lastName',  form.lastName.trim());
      fd.append('phone',     form.phone.trim());
      if (isStaff) fd.append('bio', form.bio.trim());
      if (imageFile) fd.append('profileImage', imageFile);

      const { data } = await profileService.updateMyProfile(fd);
      toast.success('Profile updated!');
      onUpdated(data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#F5EDE4] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-white/30 max-h-[95dvh] overflow-y-auto">

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/60 rounded-full hover:rotate-90 hover:bg-white transition-all duration-300 border border-white/30"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Avatar picker */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#22B8C8] to-[#1a8f9a] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#22B8C8]/30">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  initials || <User className="w-8 h-8" />
                )}
              </div>
              {/* Camera badge */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#22B8C8] text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-[#1a8f9a] transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mb-6">
            Click 📷 to change profile photo
          </p>

          <div className="h-px bg-gray-200 mb-6" />
        </div>

        {/* Form */}
        <div className="px-8 pb-8 space-y-4">

          {/* First Name */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5 block">
              First Name
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5 block">
              Last Name
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5 block">
              Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="07xxx xxxxxx"
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30"
            />
          </div>

          {/* Bio — staff only */}
          {isStaff && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1.5 block">
                Bio <span className="text-gray-300 font-normal normal-case">(max 500 chars)</span>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell clients a bit about yourself…"
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30 resize-none"
              />
              <p className="text-right text-[10px] text-gray-300 mt-1">{form.bio.length}/500</p>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-[#22B8C8] hover:bg-[#1a8f9a] disabled:opacity-60 text-white font-black rounded-2xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : 'Save Changes'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 font-bold text-gray-400 hover:text-red-400 transition-colors uppercase tracking-widest text-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdateModal;