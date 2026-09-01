import { domRefs } from './dom.js';

/**
 * Show the "export confirmation" modal that asks the user to check the target
 * download path for any same-name knowledge base folder before exporting.
 * Shown on every export start unless disabled in settings / via "don't ask again".
 * @returns {Promise<'continue'|'noPrompt'|'cancel'>} user choice
 */
export function promptReExport() {
  return new Promise(resolve => {
    const modal = domRefs.reExportModal;
    if (!modal) { resolve('cancel'); return; }
    showModal(true);

    const finish = choice => {
      showModal(false);
      detachHandlers();
      resolve(choice);
    };

    const handler = choice => () => finish(choice);
    if (domRefs.reExportOverwriteBtn) domRefs.reExportOverwriteBtn.onclick = handler('continue');
    if (domRefs.reExportCleanBtn) domRefs.reExportCleanBtn.onclick = handler('noPrompt');
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
