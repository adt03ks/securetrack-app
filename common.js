(function () {
  const cfg = window.SECURETRACK_CONFIG || {};
  const demoDevice = {
    public_token: "DEMO-CEW-014",
    asset_code: "CEW-014",
    device_type: "Conducted Energy Weapon",
    manufacturer: "Axon",
    model: "TASER 7",
    serial_last4: "4821",
    image_url: "assets/device-placeholder.svg",
    status: "available",
    attention_required: false
  };

  function hasSupabaseConfig() {
    return !!cfg.supabaseUrl && !!cfg.supabaseAnonKey && !cfg.supabaseUrl.includes("YOUR_") && !cfg.supabaseAnonKey.includes("YOUR_");
  }

  const client = hasSupabaseConfig() && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

  function assetToken() {
    const fromUrl = new URLSearchParams(location.search).get("asset");
    if (fromUrl) sessionStorage.setItem("securetrack_asset", fromUrl);
    return fromUrl || sessionStorage.getItem("securetrack_asset") || (cfg.demoMode ? demoDevice.public_token : "");
  }

  function verifiedToken() { return sessionStorage.getItem("securetrack_verified_asset"); }
  function markVerified(token) { sessionStorage.setItem("securetrack_verified_asset", token); }
  function isVerified(token) { return !!token && verifiedToken() === token; }

  async function getDevice(token) {
    if (!token) throw new Error("No asset token was provided by the QR code or NFC tag.");
    if (!client) {
      if (cfg.demoMode) return { ...demoDevice, public_token: token };
      throw new Error("Supabase is not configured. Add your project URL and anon key in config.js.");
    }
    const { data, error } = await client.rpc("get_device_public", { p_public_token: token });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Device not found or inactive.");
    return row;
  }

  async function verifyDevice(token) {
    const device = await getDevice(token);
    markVerified(token);
    return device;
  }

  function requireVerified() {
    const token = assetToken();
    if (!isVerified(token)) {
      const back = `index.html?asset=${encodeURIComponent(token || "")}`;
      location.replace(back);
      return null;
    }
    return token;
  }

  function imageFor(device) { return device?.image_url || "assets/device-placeholder.svg"; }
  function modelFor(device) { return [device?.manufacturer, device?.model].filter(Boolean).join(" ") || "Unknown model"; }
  function maskSerial(last4) { return last4 ? `••••${last4}` : "Not displayed"; }

  function renderDeviceSummary(device, root) {
    if (!root) return;
    root.innerHTML = `
      <img src="${imageFor(device)}" alt="${device.asset_code || "Equipment"} device image">
      <div class="summary-meta">
        <div class="eyebrow">Verified scan target</div>
        <h3 style="font-size:24px;margin:7px 0 4px">${device.asset_code}</h3>
        <div class="subtle">${modelFor(device)}</div>
        <div class="summary-stack" style="margin-top:14px">
          <div class="summary-detail"><span>Device type</span><strong>${device.device_type || "Registered equipment"}</strong></div>
          <div class="summary-detail"><span>Serial</span><strong>${maskSerial(device.serial_last4)}</strong></div>
          <div class="summary-detail"><span>Status</span><strong>${(device.status || "available").replace(/_/g, " ")}</strong></div>
        </div>
      </div>`;
  }

  async function rpc(name, params) {
    if (!client) {
      if (!cfg.demoMode) throw new Error("Supabase is not configured.");
      return { demo: true, occurred_at: new Date().toISOString(), ...params };
    }
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }

  function showResult(el, message, type = "success") {
    el.className = `result show ${type}`;
    el.textContent = message;
  }

  window.SecureTrack = {
    cfg, client, assetToken, getDevice, verifyDevice, requireVerified, isVerified,
    imageFor, modelFor, renderDeviceSummary, rpc, showResult
  };
})();
