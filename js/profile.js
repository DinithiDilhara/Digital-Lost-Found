DLF.profile = {
  async render() {
    const user = await DLF.api.getUser(); const reports = await DLF.api.getMyReports(); const { icon, escape, error } = DLF.ui;
    document.querySelector('#main').innerHTML = `<div class="page-heading"><div><span class="eyebrow">YOUR CAMPUS IDENTITY</span><h2>My Profile</h2><p>A familiar face in a connected community.</p></div></div><div class="profile-layout"><aside class="panel profile-summary"><div class="profile-cover"></div><div class="avatar profile-avatar">${escape(DLF.ui.initials(user.name))}</div><h3>${escape(user.name)}</h3><p>Campus community member</p><span class="profile-pill">${icon('campus')}Student</span><div class="profile-stats"><div><strong>${reports.length}</strong><span>Reports</span></div><div><strong>${reports.filter(item => item.status !== 'Open').length}</strong><span>Resolved</span></div></div><div class="profile-thanks">${icon('heart')}Thank you for making campus a little more connected.</div></aside><div><section class="panel profile-details"><div class="content-heading"><h3>Personal Information</h3><button class="btn btn-outline btn-small" id="edit-profile">${icon('edit')}Edit Profile</button></div><dl class="profile-fields"><div><dt>Full Name</dt><dd>${escape(user.name)}</dd></div><div><dt>Registration Number</dt><dd>${escape(user.registration)}</dd></div><div><dt>University Email</dt><dd>${escape(user.email)}</dd></div></dl><div class="notice">${icon('shield')}Your email and registration number are not displayed on public reports.</div></section><section class="panel security-panel"><span class="security-icon">${icon('shield')}</span><div><h3>Account Security</h3><p>Manage your password and account access.</p></div><button class="btn btn-outline btn-small" id="change-password">Change Password</button></section><p class="prototype-caption">Profile changes are saved in this browser for the frontend prototype.</p></div></div>`;
    document.querySelector('#edit-profile').onclick = () => {
      const dialog = DLF.ui.modal({ title: 'Edit your profile', content: `<div class="field"><label for="profile-name">Full Name</label><input id="profile-name" name="name" value="${escape(user.name)}" maxlength="80" autocomplete="name">${error('name')}</div><div class="field"><label for="profile-registration">Registration Number</label><input id="profile-registration" name="registration" value="${escape(user.registration)}" maxlength="40">${error('registration')}</div><div class="field"><label for="profile-email">University Email</label><input id="profile-email" name="email" type="email" value="${escape(user.email)}" maxlength="150" autocomplete="email">${error('email')}</div>`, confirmText: 'Save Changes', onConfirm: async modal => {
        const form = modal.querySelector('form'); if (!DLF.ui.validate(form, { name: DLF.ui.required('Full name'), registration: DLF.ui.required('Registration number'), email: DLF.ui.emailRule })) return false;
        const values = Object.fromEntries(new FormData(form)); Object.keys(values).forEach(key => values[key] = values[key].trim());
        const updated = await DLF.api.updateProfile(values);
        document.querySelector('[data-user-name]').textContent = updated.name; document.querySelector('[data-avatar]').textContent = DLF.ui.initials(updated.name);
        await DLF.profile.render(); DLF.ui.toast('Profile updated successfully.');
      } });
      dialog.querySelector('input').focus();
    };
    document.querySelector('#change-password').onclick = () => {
      const dialog = DLF.ui.modal({ title: 'Change password', content: `<p>Preview the password change flow. This demo does not store or enforce passwords.</p>${DLF.ui.passwordField('New Password', 'newPassword', 'new-password')}${DLF.ui.passwordField('Confirm Password', 'confirmPassword', 'new-password')}`, confirmText: 'Preview password change', onConfirm: async modal => {
        const form = modal.querySelector('form');
        if (!DLF.ui.validate(form, { newPassword: value => value.length >= 8 ? '' : 'Use at least 8 characters.', confirmPassword: value => value && value === form.elements.newPassword.value ? '' : 'Passwords must match.' })) return false;
        await DLF.api.changePassword(form.elements.newPassword.value); DLF.ui.toast('Password change validated. Demo passwords are not stored.');
      } });
      DLF.ui.bindPasswords(dialog);
    };
  }
};
