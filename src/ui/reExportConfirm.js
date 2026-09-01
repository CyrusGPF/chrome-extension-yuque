import { domRefs } from './dom.js';

// Books the user has already confirmed to re-export after cleaning this session.
const cleanConfirmedBookIds = new Set();

/**
 * Show the "same-name knowledge base re-export" confirmation modal.
 * @param {string[]} bookNames  names of knowledge bases that were exported before
 * @returns {Promise<'overwrite'|'clean'|'cancel'|null>} user choice, null if no modal shown
 */
export function promptReExport(bookNames) {
  return new Promise(resolve => {
    const modal = domRefs.reExportModal;
    if (!modal || !Array.isArray(bookNames) || !bookNames.length) {
      resolve(null);
      return;
    }

    if (domRefs.reExportBookName) {
      domRefs.reExportBookName.textContent = bookNames.join('、');
    }
    showModal(true);

    const finish = choice => {
      showModal(false);
      detachHandlers();
      resolve(choice);
    };

    const handler = choice => () => finish(choice);
    if (domRefs.reExportOverwriteBtn) domRefs.reExportOverwriteBtn.onclick = handler('overwrite');
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

export function markCleanConfirmed(bookIds) {
  (bookIds || []).forEach(id => cleanConfirmedBookIds.add(String(id)));
}

export function isCleanConfirmed(bookId) {
  return cleanConfirmedBookIds.has(String(bookId));
}
