import { useEffect, useState } from "react";
import { getCurrentUser, updateUserProfile, logout } from "../../lib/authApi";

const NAV_ITEMS = [
  { key: "info", label: "User info", icon: "user" },
//   { key: "favorites", label: "Favorites", icon: "heart" },
//   { key: "watchlist", label: "Watchlist", icon: "star" },
//   { key: "settings", label: "Setting", icon: "gear" },
//   { key: "notifications", label: "Notifications", icon: "bell" },
];

function Icon({ name, className }) {
  const paths = {
    user: (
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    ),
    heart: (
      <path d="M12 20s-7-4.4-9.5-8.6C.7 8.2 2 4.8 5.2 4c1.9-.5 3.8.3 4.8 1.9C11 4.3 12.9 3.5 14.8 4c3.2.8 4.5 4.2 2.7 7.4C19 15.6 12 20 12 20z" />
    ),
    star: (
      <path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7L12 2z" />
    ),
    gear: (
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6zm7-3a7 7 0 00-.2-1.6l2-1.5-2-3.4-2.4 1a7 7 0 00-1.4-.8L14.5 2h-5l-.5 2.7c-.5.2-1 .5-1.4.8l-2.4-1-2 3.4 2 1.5A7 7 0 002 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.4-1c.4.3.9.6 1.4.8L7 21h5l.5-2.7c.5-.2 1-.5 1.4-.8l2.4 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6z" />
    ),
    bell: (
      <path d="M12 22a2.2 2.2 0 002.2-2.2H9.8A2.2 2.2 0 0012 22zm7-6.2V11c0-3.4-1.8-6.2-5-7V3a2 2 0 10-4 0v1c-3.2.8-5 3.6-5 7v4.8L3 18v1h18v-1l-2-2.2z" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {paths[name]}
    </svg>
  );
}

/**
 * Profile — "User Profile" page: sidebar nav + editable account info form.
 * Route example: /profile
 */
export default function Profile() {
  const [activeNav, setActiveNav] = useState("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    postalCode: "",
    avatar: "",
  });

  useEffect(() => {
    let ignore = false;
    getCurrentUser()
      .then((user) => {
        if (ignore) return;
        setForm({
          firstName: user.firstName || user.name?.split(" ")[0] || "",
          lastName: user.lastName || user.name?.split(" ")[1] || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.location || "",
          postalCode: user.postalCode || "",
          avatar: user.avatar || "",
        });
      })
      .catch(() => {
        if (!ignore) window.location.href = "/login";
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateUserProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err?.message || "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const fullName = `${form.firstName} ${form.lastName}`.trim() || "Your name";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-medium">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top bar */}
      {/* <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <button className="text-slate-700" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 relative" aria-label="Notifications">
            <Icon name="bell" className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={form.avatar || "https://i.pravatar.cc/64"}
              alt={fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-slate-700">{fullName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </header> */}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-100 px-6 py-8 flex flex-col min-h-[calc(100vh-73px)]">
          <h1 className="text-2xl font-bold text-slate-900 mb-8">User Profile</h1>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    active
                      ? "text-slate-900 font-semibold border-l-2 border-orange-500 bg-orange-50/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon name={item.icon} className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-2 text-sm text-red-500 hover:text-red-600 px-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button> */}
        </aside>

        {/* Main content */}
        <main className="flex-1 px-12 py-10">
          {activeNav !== "info" ? (
            <p className="text-slate-400">This section isn't built yet.</p>
          ) : (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-6 mb-10">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-200 to-orange-300">
                    <img
                      src={form.avatar || "https://i.pinimg.com/736x/32/9b/54/329b54d07444f009b0634f438db9a449.jpg"}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center cursor-pointer shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setForm((f) => ({ ...f, avatar: url }));
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{fullName}</h2>
                  <p className="text-slate-400 text-sm mt-1">{form.location || "Add your location"}</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-6 max-w-2xl">
                <Field label="Name" value={form.firstName} onChange={handleChange("firstName")} />
                <Field label="Full Name" value={form.lastName} onChange={handleChange("lastName")} />
                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                />
                <Field label="Phone Number" value={form.phone} onChange={handleChange("phone")} />
                <Field
                  label="Location"
                  placeholder="e.g. New York, USA"
                  value={form.location}
                  onChange={handleChange("location")}
                />
                <Field
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={handleChange("postalCode")}
                />
              </div>

              {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

              <div className="flex justify-center mt-10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg shadow-orange-200 hover:opacity-90 disabled:opacity-60 transition"
                >
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition"
      />
    </label>
  );
}
