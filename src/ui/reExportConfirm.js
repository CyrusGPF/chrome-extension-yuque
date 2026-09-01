import { domRefs } from './dom.js';

/**
 * Show the "export confirmation" modal asking the user to check the target
 * download path for any same-name knowledge base folder before exporting.
 * Shown on every export start unless disabled in settings / via "don't ask again".
 * @returns {Promise<{choice:'continue'|'clean'|'cancel', noPrompt:boolean}>}
 */
export function promptReExport() {
  return new Promise(resolve => {
    const modal = domRefs.reExportModal;
    if (!modal) { resolve({ choice: 'cancel', noPrompt: false }); return; }
    showModal(true);
    if (domRefs.reExportNoPrompt) domRefs.reExportNoPrompt.checked = false;

    const finish = choice => {
      const noPrompt = domRefs.reExportNoPrompt ? domRefs.reExportNoPrompt.checked : false;
      showModal(false);
      detachHandlers();
      resolve({ choice, noPrompt });
    };

    const handler = choice => () => finish(choice);
    if (domRefs.reExportOverwriteBtn) domRefs.reExportOverwriteBtn.onclick = handler('continue');
    if (domRefs.reExportCleanBtn) domRefs.reExportCleanBtn.onclick = handler('clean');
    if (domRefs.reExportCancelBtn) domRefs.reExportCancelBtn.onclick = handler('cancel');
    if (domRefs.reExportModalClose) domRefs.reExportModalClose.onclick = handler('cancel');
    modal.onclick = e => { if (e.target === modal) finish('cancel'); };

    function detachHandlers() {
      modal.onclick = null;
      if (domRefs.reExportOverwriteBtn) domRefs.reExportOverwriteBtn.onclick = null;
      if (domRefs.reExportCleanBtn) domRefs.reExportCleanBtn.onclick = null;
      if (domRefs.reExportCancelBtn) domRefs.reExportCancelBtn.onclick = null;
      if (domRefs.reExportModalClose) domRefs.reExportModalClose.onclick = null;
    }
  });
}

function showModal(shouldShow) {
  const { reExportModal, mainContainer } = domRefs;
  if (!reExportModal) return;

  if (shouldShow) {
    reExportModal.removeAttribute('inert');
    reExportModal.classList.add('is-visible');
    document.body.classList.add('modal-open');
    if (mainContainer) mainContainer.setAttribute('inert', '');
  } else {
    if (mainContainer) mainContainer.removeAttribute('inert');
    document.body.classList.remove('modal-open');
    reExportModal.classList.remove('is-visible');
    setTimeout(() => { reExportModal.setAttribute('inert', ''); }, 300);
  }
}
