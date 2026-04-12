/**
 * Admin inbox — messages from contact form (Supabase)
 */

let allSubmissions = [];
let refreshIntervalId = null;
let realtimeChannel = null;

const REFRESH_MS = 20000;

document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const adminSection = document.querySelector('.admin-section');
  if (!adminSection) return;

  loadSubmissions();
  startAutoRefresh();
  subscribeToSubmissionChanges();
});

/**
 * @param {object} [options]
 * @param {boolean} [options.silent] — background refresh (no full-page loading state)
 */
async function loadSubmissions(options) {
  const silent = options && options.silent === true;

  const loadingDiv = document.getElementById('adminLoading');
  const errorDiv = document.getElementById('adminError');
  const containerDiv = document.getElementById('submissionsContainer');
  const emptyStateDiv = document.getElementById('emptyState');
  const refreshBtn = document.getElementById('adminRefreshBtn');

  try {
    if (!silent) {
      if (refreshBtn) refreshBtn.disabled = true;
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      containerDiv.innerHTML = '';
      emptyStateDiv.style.display = 'none';
    }

    const { data, error } = await supabaseClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (!silent) {
      loadingDiv.style.display = 'none';
      if (refreshBtn) refreshBtn.disabled = false;
    }

    if (error) {
      console.error('Error fetching messages:', error);
      if (!silent) {
        showError(error.message || 'Failed to load messages');
      }
      return;
    }

    allSubmissions = data || [];
    errorDiv.style.display = 'none';

    if (allSubmissions.length === 0) {
      emptyStateDiv.style.display = 'block';
      containerDiv.innerHTML = '';
      if (!silent) {
        console.info(
          '[Admin] 0 rows. If data exists in Supabase Table Editor, RLS likely blocks SELECT for anon — run supabase/rls-contact_submissions.sql'
        );
      }
    } else {
      emptyStateDiv.style.display = 'none';
      displaySubmissions();
    }

    updateStats();
    setLastSyncedLabel();
  } catch (err) {
    console.error('Unexpected error:', err);
    if (!silent) {
      loadingDiv.style.display = 'none';
      if (refreshBtn) refreshBtn.disabled = false;
      showError(err.message || 'An unexpected error occurred');
    }
  }
}

function setLastSyncedLabel() {
  const el = document.getElementById('adminLastSync');
  if (!el) return;
  const t = new Date();
  el.textContent =
    'Updated ' +
    t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function startAutoRefresh() {
  if (refreshIntervalId) clearInterval(refreshIntervalId);

  refreshIntervalId = setInterval(function () {
    if (!document.hidden) {
      loadSubmissions({ silent: true });
    }
  }, REFRESH_MS);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      loadSubmissions({ silent: true });
    }
  });
}

function subscribeToSubmissionChanges() {
  try {
    realtimeChannel = supabaseClient
      .channel('admin_contact_submissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_submissions' },
        function () {
          loadSubmissions({ silent: true });
        }
      )
      .subscribe(function (status) {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Supabase Realtime not available for contact_submissions; auto-refresh still runs every ' + REFRESH_MS / 1000 + 's. Enable replication for this table in Supabase if you want instant updates.');
        }
      });
  } catch (e) {
    console.warn('Realtime subscribe failed:', e);
  }
}

function displaySubmissions() {
  const containerDiv = document.getElementById('submissionsContainer');
  containerDiv.innerHTML = '';

  allSubmissions.forEach(function (submission) {
    const card = createSubmissionCard(submission);
    containerDiv.appendChild(card);
  });
}

function createSubmissionCard(submission) {
  const card = document.createElement('div');
  const isRead = Boolean(submission.is_read);
  card.className = 'submission-card ' + (isRead ? 'read' : 'unread');
  card.id = 'submission-' + submission.id;

  const date = new Date(submission.created_at);
  const formattedDate = isNaN(date.getTime()) ? '—' : formatDate(date);

  const senderName = submission.full_name || 'Unknown Sender';
  const senderEmail = submission.email || 'No email';
  const subject = submission.subject || 'No Subject';
  const message = submission.message || 'No message';

  card.innerHTML =
    '<span class="submission-badge ' +
    (isRead ? 'read' : 'unread') +
    '">' +
    (isRead ? 'Read' : 'Unread') +
    '</span>' +
    '<div class="submission-from">From</div>' +
    '<h3 class="submission-name">' +
    escapeHtml(senderName) +
    '</h3>' +
    '<a href="mailto:' +
    escapeHtml(senderEmail) +
    '" class="submission-email">' +
    escapeHtml(senderEmail) +
    '</a>' +
    '<div class="submission-subject">Subject: ' +
    escapeHtml(subject) +
    '</div>' +
    '<div class="submission-message">' +
    escapeHtml(message) +
    '</div>' +
    '<div class="submission-date">' +
    escapeHtml(formattedDate) +
    '</div>' +
    '<div class="submission-actions">' +
    (isRead
      ? '<button type="button" class="mark-unread-btn" data-action="toggle-read" data-id="' +
        submission.id +
        '" data-read="0">Mark as Unread</button>'
      : '<button type="button" class="mark-read-btn" data-action="toggle-read" data-id="' +
        submission.id +
        '" data-read="1">Mark as Read</button>') +
    '</div>';

  card.querySelector('[data-action="toggle-read"]').addEventListener('click', function () {
    const id = Number(this.getAttribute('data-id'));
    const read = this.getAttribute('data-read') === '1';
    toggleReadStatus(id, read);
  });

  return card;
}

async function toggleReadStatus(submissionId, isRead) {
  try {
    const { error } = await supabaseClient
      .from('contact_submissions')
      .update({ is_read: isRead })
      .eq('id', submissionId);

    if (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message. Please try again.');
      return;
    }

    const submission = allSubmissions.find(function (s) {
      return s.id === submissionId;
    });
    if (submission) {
      submission.is_read = isRead;
    }

    const card = document.getElementById('submission-' + submissionId);
    if (card) {
      if (isRead) {
        card.classList.remove('unread');
        card.classList.add('read');
      } else {
        card.classList.remove('read');
        card.classList.add('unread');
      }

      const badge = card.querySelector('.submission-badge');
      if (badge) {
        badge.classList.toggle('unread', !isRead);
        badge.classList.toggle('read', isRead);
        badge.textContent = isRead ? 'Read' : 'Unread';
      }

      const button = card.querySelector('.mark-read-btn, .mark-unread-btn');
      if (button) {
        if (isRead) {
          button.className = 'mark-unread-btn';
          button.textContent = 'Mark as Unread';
          button.setAttribute('data-read', '0');
        } else {
          button.className = 'mark-read-btn';
          button.textContent = 'Mark as Read';
          button.setAttribute('data-read', '1');
        }
        button.replaceWith(button.cloneNode(true));
        const newBtn = card.querySelector('.mark-read-btn, .mark-unread-btn');
        newBtn.addEventListener('click', function () {
          toggleReadStatus(submissionId, newBtn.getAttribute('data-read') === '1');
        });
      }
    }

    updateStats();
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred. Please try again.');
  }
}

function updateStats() {
  const totalCount = allSubmissions.length;
  const unreadCount = allSubmissions.filter(function (s) {
    return !s.is_read;
  }).length;

  const totalElement = document.getElementById('totalCount');
  const unreadElement = document.getElementById('unreadCount');

  if (totalElement) {
    totalElement.textContent = totalCount;
  }
  if (unreadElement) {
    unreadElement.textContent = unreadCount;
  }
}

function showError(errorText) {
  const errorDiv = document.getElementById('adminError');
  const errorTextElement = document.getElementById('adminErrorText');

  if (errorTextElement) {
    errorTextElement.textContent = errorText;
  }
  if (errorDiv) {
    errorDiv.style.display = 'block';
  }
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
