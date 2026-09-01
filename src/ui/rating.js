import { domRefs } from './dom.js';
import { i18n } from './i18n.js';

const REVIEW_URL = 'https://chromewebstore.google.com/detail/icljaabdjepbbbhjpncinffplhghignc/reviews';
const SHOW_DELAY_MS = 2500;

export function showRatingModalAfterExport() {
  setTimeout(async () => {
    const { ratingDismissed } = await chrome.storage.local.get('ratingDismissed');
    if (ratingDismissed) return;
    toggleRatingModal(true);
  }, SHOW_DELAY_MS);
}

export function initRatingModal() {
  const { ratingModal, ratingModalClose, ratingReviewBtn, ratingDismissBtn, ratingLaterBtn } = domRefs;
  if (!ratingModal) return;

  if (ratingReviewBtn) {
    ratingReviewBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: REVIEW_URL });
      toggleRatingModal(false);
    });
  }

  if (ratingDismissBtn) {
    ratingDismissBtn.addEventListener('click', () => {
      chrome.storage.local.set({ ratingDismissed: true });
      toggleRatingModal(false);
    });
  }

  if (ratingLaterBtn) {
    ratingLaterBtn.addEventListener('click', () => {
      toggleRatingModal(false);
    });
  }

  if (ratingModalClose) {
    ratingModalClose.addEventListener('click', () => {
      toggleRatingModal(false);
    });
  }

  ratingModal.addEventListener('click', (e) => {
    if (e.target === ratingModal) toggleRatingModal(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ratingModal.classList.contains('is-visible')) {
      toggleRatingModal(false);
    }
  });
}

function toggleRatingModal(shouldShow) {
  const { ratingModal, mainContainer } = domRefs;
  if (!ratingModal) return;

  if (shouldShow) {
    ratingModal.removeAttribute('inert');
    ratingModal.classList.add('is-visible');
    document.body.classList.add('modal-open');
    if (mainContainer) mainContainer.setAttribute('inert', '');
  } else {
    if (mainContainer) mainContainer.removeAttribute('inert');
    document.body.classList.remove('modal-open');
    ratingModal.classList.remove('is-visible');
    setTimeout(() => { ratingModal.setAttribute('inert', ''); }, 300);
  }
}
