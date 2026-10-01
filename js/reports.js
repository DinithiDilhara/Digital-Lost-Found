DLF.reports = {
  async form() {
    const params = new URLSearchParams(location.search); const id = params.get('edit');
    const existing = id ? await DLF.api.getItem(id) : null;
    const { icon, escape, error } = DLF.ui;
    if (id && (!existing || existing.ownerId !== DLF.api.getSession().id)) {
      document.querySelector('#main').innerHTML = DLF.ui.empty('Report unavailable', 'Only your own reports can be edited.', '<a class="btn btn-primary" href="my-reports.html">My Reports</a>'); return;
    }
    let type = existing?.type || (['lost', 'found'].includes(params.get('type')) ? params.get('type') : '');
    document.querySelector('#main').innerHTML = `<div class="page-heading"><div><span class="eyebrow">EVERY REPORT MAKES A DIFFERENCE</span><h2>${existing ? 'Edit Your Report' : 'What would you like to report?'}</h2><p>${existing ? 'Keep your report up to date so your campus can help.' : 'Lost something or found something? You’re in the right place.'}</p></div></div>${!existing ? `<div class="report-choices">${[['lost', 'Report Lost Item', 'Let your campus help you find it.', 'search'], ['found', 'Report Found Item', 'Help someone get their belongings back.', 'found']].map(([value, title, description, glyph]) => `<button class="report-choice ${value}" data-type="${value}" aria-pressed="false"><span class="choice-icon">${icon(glyph)}</span><span><strong>${title}</strong><small>${description}</small></span><span class="choice-check">${icon('check')}</span></button>`).join('')}</div>` : ''}<div id="report-form-slot"></div>`;
    const renderForm = () => {
      document.querySelectorAll('[data-type]').forEach(button => { button.classList.toggle('selected', button.dataset.type === type); button.setAttribute('aria-pressed', String(button.dataset.type === type)); });
      if (!type) return;
      const value = key => escape(existing?.[key] || '');
      document.querySelector('#report-form-slot').innerHTML = `<div class="report-layout"><section class="panel report-panel"><div class="panel-title"><h3>${existing ? 'Report details' : `${type === 'lost' ? 'Lost' : 'Found'} item details`}</h3><p>Fields marked with <span class="required">*</span> are required.</p></div><form id="report-form" novalidate><div class="form-grid"><div class="field span-two"><label for="name">Item Name <span class="required">*</span></label><input id="name" name="name" placeholder="e.g. Black Casio Calculator" value="${value('name')}" maxlength="100" required>${error('name')}</div><div class="field"><label for="category">Category <span class="required">*</span></label><select id="category" name="category" required><option value="">Select a category</option>${DLF.data.categories.map(category => `<option ${existing?.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select>${error('category')}</div><div class="field"><label for="color">Color</label><input id="color" name="color" placeholder="e.g. Black" value="${value('color')}" maxlength="40"></div><div class="field"><label for="date">Date ${type === 'lost' ? 'Lost' : 'Found'} <span class="required">*</span></label><input type="date" id="date" name="date" value="${value('date')}" max="${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}" required>${error('date')}</div><div class="field"><label for="location">Location ${type === 'lost' ? 'Lost' : 'Found'} <span class="required">*</span></label><input id="location" name="location" list="campus-locations" placeholder="Select or type a campus location" value="${value('location')}" maxlength="100" required><datalist id="campus-locations">${DLF.data.locations.map(location => `<option value="${location}">`).join('')}</datalist>${error('location')}</div><div class="field span-two"><label for="description">Description <span class="required">*</span></label><textarea id="description" name="description" rows="4" placeholder="Describe the item and where it was last seen. A few details can make a big difference." maxlength="2000" required>${value('description')}</textarea>${error('description')}</div>${type === 'lost' ? `<div class="field span-two"><label for="contact">Contact Information <span class="optional">(optional)</span></label><input id="contact" name="contact" placeholder="Preferred email or contact details" value="${value('contact')}" maxlength="150"><span class="field-hint">Stored in your report locally; not shown in public item details.</span></div>` : ''}<div class="field span-two"><label for="image">Upload Image <span class="optional">(optional)</span></label><div class="upload-zone"><span class="upload-icon">${icon('upload')}</span><strong>Add a photo of the item</strong><span>JPG, PNG or WebP · Up to 2 MB</span><input type="file" id="image" name="imageFile" accept="image/jpeg,image/png,image/webp" aria-describedby="error-image"><div id="image-preview">${existing ? `<img src="${DLF.ui.safeImage(existing.image)}" alt="Current item image">` : ''}</div><button type="button" class="text-button" id="remove-image" ${existing ? '' : 'hidden'}>Remove image</button></div>${error('image')}</div></div><p class="form-error" id="report-error" role="alert"></p><div class="form-actions"><a class="btn btn-plain" href="my-reports.html">Cancel</a><button type="submit" class="btn btn-primary">${icon('plus')}${existing ? 'Save Changes' : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Report`}</button></div></form></section><aside class="report-tips"><span class="tips-icon">${icon('match')}</span><h3>A good report goes a long way.</h3><div><strong>Be specific</strong><p>Add the brand, color, and a useful description.</p></div><div><strong>Pinpoint the location</strong><p>A building, floor, or nearby landmark helps narrow the search.</p></div><div><strong>Keep a detail to yourself</strong><p>Save one unique detail to help verify ownership.</p></div><div class="notice">${icon('shield')}Avoid sharing sensitive personal information in your description.</div></aside></div>`;
      let image = existing?.image || ''; let imageLoading = false;
      const form = document.querySelector('#report-form'); const fileInput = document.querySelector('#image');
      let imageVersion = 0;
      fileInput.onchange = async () => {
        const version = ++imageVersion; const file = fileInput.files[0];
        document.querySelector('[data-error="image"]').textContent = ''; fileInput.setAttribute('aria-invalid', 'false');
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          document.querySelector('[data-error="image"]').textContent = 'Choose a JPG, PNG, or WebP image smaller than 2 MB.'; fileInput.setAttribute('aria-invalid', 'true'); fileInput.value = ''; return;
        }
        imageLoading = true;
        try {
          const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read that image.')); reader.readAsDataURL(file); });
          const preview = new Image(); await new Promise((resolve, reject) => { preview.onload = resolve; preview.onerror = () => reject(new Error('This file is not a valid image.')); preview.src = data; });
          if (version !== imageVersion) return;
          image = data; document.querySelector('#image-preview').innerHTML = `<img src="${DLF.ui.safeImage(image)}" alt="Selected item image preview">`; document.querySelector('#remove-image').hidden = false;
        } catch (error) { document.querySelector('[data-error="image"]').textContent = error.message; }
        finally { if (version === imageVersion) imageLoading = false; }
      };
      document.querySelector('#remove-image').onclick = () => { imageVersion++; imageLoading = false; image = ''; fileInput.value = ''; document.querySelector('#image-preview').innerHTML = ''; document.querySelector('#remove-image').hidden = true; };
      form.onsubmit = async event => {
        event.preventDefault();
        if (!DLF.ui.validate(form, { name: DLF.ui.required('Item name'), category: DLF.ui.required('Category'), date: value => !value ? 'Date is required.' : value > form.elements.date.max ? 'The date cannot be in the future.' : '', location: DLF.ui.required('Location'), description: DLF.ui.required('Description') })) return;
        if (imageLoading) { DLF.ui.toast('Wait for the image preview to finish.', 'warning'); return; }
        const values = Object.fromEntries(new FormData(form)); delete values.imageFile;
        Object.keys(values).forEach(key => values[key] = values[key].trim()); values.image = image;
        const button = event.submitter; button.disabled = true;
        try {
          if (existing) await DLF.api.updateReport(existing.id, values);
          else if (type === 'lost') await DLF.api.reportLostItem(values); else await DLF.api.reportFoundItem(values);
          DLF.ui.flash(existing ? 'Report updated successfully.' : `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully.`);
          location.href = 'my-reports.html';
        } catch (error) { document.querySelector('#report-error').textContent = error.message; button.disabled = false; }
      };
    };
    document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => { if (type === button.dataset.type) return; type = button.dataset.type; renderForm(); });
    renderForm();
  },
  async mine() {
    const { icon, escape } = DLF.ui; let active = 'all';
    document.querySelector('#main').innerHTML = `<div class="page-heading"><div><span class="eyebrow">YOUR CONTRIBUTIONS</span><h2>My Reports</h2><p>Manage your reports and keep track of happy reunions.</p></div><a class="btn btn-primary" href="report-item.html">${icon('plus')}New Report</a></div><div class="report-tabs" aria-label="Filter your reports">${['all', 'lost', 'found', 'resolved'].map(type => `<button data-tab="${type}" class="${type === 'all' ? 'active' : ''}" aria-pressed="${type === 'all'}">${type[0].toUpperCase() + type.slice(1)}</button>`).join('')}</div><div id="my-reports-list"></div>`;
    const draw = async () => {
      let items = await DLF.api.getMyReports();
      items = items.filter(item => active === 'all' || (active === 'resolved' ? item.status !== 'Open' : item.type === active));
      document.querySelector('#my-reports-list').innerHTML = items.length ? `<div class="report-list">${items.map(item => `<article class="panel report-row"><a href="item-details.html?id=${item.id}" class="report-thumbnail"><img src="${DLF.ui.safeImage(item.image)}" alt="${escape(item.name)}"></a><div class="report-row-info"><div class="detail-badges">${DLF.ui.badge(item)}${item.status === 'Open' ? '<span class="open-label">Open</span>' : ''}</div><h3><a href="item-details.html?id=${item.id}">${escape(item.name)}</a></h3><p>${icon('pin')}${escape(item.location)}<span>·</span>${DLF.ui.date(item.date)}</p></div><div class="report-row-actions"><a class="btn btn-outline btn-small" href="item-details.html?id=${item.id}">View</a><a class="icon-button" href="report-item.html?edit=${item.id}" aria-label="Edit ${escape(item.name)}">${icon('edit')}</a><button class="icon-button danger-text" data-delete="${item.id}" aria-label="Delete ${escape(item.name)}">${icon('trash')}</button>${item.status === 'Open' ? `<button class="text-button resolve-button" data-resolve="${item.id}">${icon('check')}Mark as ${item.type === 'found' ? 'Returned' : 'Resolved'}</button>` : ''}</div></article>`).join('')}</div>` : DLF.ui.empty('No reports here yet', 'Your lost and found reports will appear here.', '<a class="btn btn-primary" href="report-item.html">Create a Report</a>');
      document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => DLF.ui.modal({ title: 'Delete this report?', content: '<p>Are you sure you want to delete this report? This will remove it from your reports and campus listings in this browser.</p>', confirmText: 'Delete Report', danger: true, onConfirm: async () => { await DLF.api.deleteReport(button.dataset.delete); await draw(); DLF.ui.toast('Report deleted.'); } }));
      document.querySelectorAll('[data-resolve]').forEach(button => button.onclick = () => DLF.ui.modal({ title: 'Another happy reunion?', content: '<p>Mark this item as returned or resolved? It will remain in your report history and no longer accept claims.</p>', confirmText: 'Mark as resolved', onConfirm: async () => { await DLF.api.resolveReport(button.dataset.resolve); await draw(); DLF.ui.toast('Report resolved. Thanks for helping your community!'); } }));
    };
    document.querySelectorAll('[data-tab]').forEach(button => button.onclick = async () => { active = button.dataset.tab; document.querySelectorAll('[data-tab]').forEach(tab => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); }); await draw(); });
    await draw();
  }
};
