// Externalized script for auth-test.html to avoid CSP issues
(function(){
  const API_BASE = window.location.origin + '/api/v1';
  let googleClientId = '';

  console.debug('[auth-test] script loaded');

  // Fetch the Google Client ID from server config
  fetch('/auth-config')
    .then(r => r.json())
    .then(cfg => {
      googleClientId = cfg.googleClientId;
      console.debug('[auth-test] googleClientId=', googleClientId);
      // Initialize Google Sign-In if SDK is ready
      if (window.google && googleClientId) {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
      }
    }).catch(err => {
      console.warn('[auth-test] failed to load auth-config', err);
    });

  // Attach event listeners
  document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleBtn');
    const devBtn = document.getElementById('devBtn');
    const copyButtons = Array.from(document.querySelectorAll('[data-copy]'));

    if (googleBtn) googleBtn.addEventListener('click', () => {
      showStatus('Google 로그인 시작...', 'info');
      triggerGoogleLogin();
    });

    if (devBtn) devBtn.addEventListener('click', () => {
      // immediate UI feedback so user sees click
      showStatus('개발용 토큰 요청 중...', 'info');
      devLogin();
    });

    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-copy');
        copyToken(id);
      });
    });

    // If SDK loads after DOMContentLoaded, initialize when available
    const sdkCheck = setInterval(() => {
      if (window.google && googleClientId) {
        try {
          google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCallback });
        } catch (e) { /* ignore */ }
        clearInterval(sdkCheck);
      }
    }, 500);
  });

  function triggerGoogleLogin() {
    if (!googleClientId) {
      showStatus('GOOGLE_CLIENT_ID가 설정되지 않았습니다. .env 파일을 확인하세요.', 'error');
      return;
    }
    if (!window.google) {
      showStatus('Google SDK 로딩 중... 잠시 후 다시 시도해주세요.', 'info');
      return;
    }
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render button and click
        const tempDiv = document.createElement('div');
        document.body.appendChild(tempDiv);
        google.accounts.id.renderButton(tempDiv, { type: 'standard', size: 'large', theme: 'outline' });
        tempDiv.querySelector('div[role=button]')?.click();
        setTimeout(() => tempDiv.remove(), 100);
      }
    });
  }

  async function handleGoogleCallback(response) {
    showStatus('Google 토큰 검증 중...', 'info');
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        displayResult(data.data);
        showStatus('✅ Google 로그인 성공!', 'success');
      } else {
        showStatus(`❌ 로그인 실패: ${data.message}`, 'error');
      }
    } catch (err) {
      console.error('[auth-test] google callback error', err);
      showStatus(`❌ 에러: ${err && err.message ? err.message : err}`, 'error');
    }
  }

  async function devLogin() {
    try {
      const emailEl = document.getElementById('devEmail');
      const nameEl = document.getElementById('devName');
      const email = (emailEl && emailEl.value) ? emailEl.value : 'test@levo.com';
      const name = (nameEl && nameEl.value) ? nameEl.value : '테스트유저';
      console.debug('[auth-test] devLogin request', { email, name });

      const res = await fetch(`${API_BASE}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      console.debug('[auth-test] devLogin response', data);
      if (data && data.success) {
        displayResult(data.data);
        showStatus('✅ 개발용 로그인 성공! (토큰 유효기간: 7일)', 'success');
      } else {
        showStatus(`❌ 실패: ${data && data.message ? data.message : '서버 오류' }`, 'error');
      }
    } catch (err) {
      console.error('[auth-test] devLogin error', err);
      showStatus(`❌ 서버 연결 에러: ${err && err.message ? err.message : err}`, 'error');
    }
  }

  function displayResult(data) {
    try {
      document.getElementById('result').classList.add('show');
      document.getElementById('userName').textContent = data.user.name;
      document.getElementById('userEmail').textContent = data.user.email;
      if (data.user.profileImage) {
        document.getElementById('userAvatar').src = data.user.profileImage;
      }
      document.getElementById('accessToken').value = data.tokens.accessToken;
      document.getElementById('refreshToken').value = data.tokens.refreshToken;
    } catch (e) {
      console.warn('[auth-test] displayResult failed', e);
    }
  }

  function copyToken(id) {
    try {
      const textarea = document.getElementById(id);
      const token = textarea.value;
      const bearerToken = `Bearer ${token}`;
      navigator.clipboard.writeText(bearerToken).then(() => {
        showStatus('✅ Bearer 토큰이 클립보드에 복사되었습니다!', 'success');
      }).catch(() => {
        textarea.select();
        document.execCommand('copy');
        showStatus('✅ 토큰이 복사되었습니다. (Bearer prefix 직접 추가 필요)', 'success');
      });
    } catch (e) {
      console.warn('[auth-test] copyToken failed', e);
      showStatus('❌ 복사 실패', 'error');
    }
  }

  function showStatus(message, type) {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = message;
    el.className = `status ${type}`;
  }

})();
