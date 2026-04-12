/**
 * Admin Panel - Contact Submissions Management
 */

let allSubmissions = [];

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', function() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
  
  // Load submissions on page load if we're on admin page
  const adminSection = document.querySelector('.admin-section');
  if (adminSection) {
    loadSubmissions();
  }
});

/**
 * Fetch all submissions from Supabase
 */
async function loadSubmissions() {
  const loadingDiv = document.getElementById('adminLoading');
  const errorDiv = document.getElementById('adminError');
  const containerDiv = document.getElementById('submissionsContainer');
  const emptyStateDiv = document.getElementById('emptyState');

  try {
    // Show loading state
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    containerDiv.innerHTML = '';
    emptyStateDiv.style.display = 'none';

    // Fetch submissions ordered by created_at descending
    const { data, error } = await supabaseClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    // Hide loading
    loadingDiv.style.display = 'none';

    if (error) {
      console.error('Error fetching submissions:', error);
      showError(error.message || 'Failed to load submissions');
      return;
    }

    allSubmissions = data || [];

    if (allSubmissions.length === 0) {
      emptyStateDiv.style.display = 'block';
      updateStats();
      return;
    }

    // Display submissions
    displaySubmissions();
    updateStats();

  } catch (err) {
    console.error('Unexpected error:', err);
    loadingDiv.style.display = 'none';
    showError(err.message || 'An unexpected error occurred');
  }
}

/**
 * Display submissions as cards
 */
function displaySubmissions() {
  const containerDiv = document.getElementById('submissionsContainer');
  containerDiv.innerHTML = '';

  allSubmissions.forEach(submission => {
    const card = createSubmissionCard(submission);
    containerDiv.appendChild(card);
  });
}

/**
 * Create a submission card element
 */
function createSubmissionCard(submission) {
  const card = document.createElement('div');
  card.className = `submission-card ${submission.is_read ? 'read' : 'unread'}`;
  card.id = `submission-${submission.id}`;

  // Format date
  const date = new Date(submission.created_at);
  const formattedDate = formatDate(date);

  // Get sender info safely
  const senderName = submission.full_name || 'Unknown Sender';
  const senderEmail = submission.email || 'No email';
  const subject = submission.subject || 'No Subject';
  const message = submission.message || 'No message';

  card.innerHTML = `
    <span class="submission-badge ${submission.is_read ? 'read' : 'unread'}">
      ${submission.is_read ? 'Read' : 'Unread'}
    </span>
    
    <div class="submission-from">From</div>
    <h3 class="submission-name">${escapeHtml(senderName)}</h3>
    <a href="mailto:${escapeHtml(senderEmail)}" class="submission-email">${escapeHtml(senderEmail)}</a>
    
    <div class="submission-subject">Subject: ${escapeHtml(subject)}</div>
    
    <div class="submission-message">${escapeHtml(message)}</div>
    
    <div class="submission-date">${formattedDate}</div>
    
    <div class="submission-actions">
      ${submission.is_read 
        ? `<button class="mark-unread-btn" onclick="toggleReadStatus(${submission.id}, false)">Mark as Unread</button>` 
        : `<button class="mark-read-btn" onclick="toggleReadStatus(${submission.id}, true)">Mark as Read</button>`
      }
    </div>
  `;

  return card;
}

/**
 * Toggle read/unread status for a submission
 */
async function toggleReadStatus(submissionId, isRead) {
  try {
    const { error } = await supabaseClient
      .from('contact_submissions')
      .update({ is_read: isRead })
      .eq('id', submissionId);

    if (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
      return;
    }

    // Update local data
    const submission = allSubmissions.find(s => s.id === submissionId);
    if (submission) {
      submission.is_read = isRead;
    }

    // Update the card UI
    const card = document.getElementById(`submission-${submissionId}`);
    if (card) {
      if (isRead) {
        card.classList.remove('unread');
        card.classList.add('read');
      } else {
        card.classList.remove('read');
        card.classList.add('unread');
      }

      // Update badge
      const badge = card.querySelector('.submission-badge');
      if (badge) {
        badge.classList.toggle('unread', !isRead);
        badge.classList.toggle('read', isRead);
        badge.textContent = isRead ? 'Read' : 'Unread';
      }

      // Update button
      const button = card.querySelector('.mark-read-btn, .mark-unread-btn');
      if (button) {
        if (isRead) {
          button.className = 'mark-unread-btn';
          button.textContent = 'Mark as Unread';
          button.onclick = () => toggleReadStatus(submissionId, false);
        } else {
          button.className = 'mark-read-btn';
          button.textContent = 'Mark as Read';
          button.onclick = () => toggleReadStatus(submissionId, true);
        }
      }
    }

    // Update stats
    updateStats();

  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred. Please try again.');
  }
}

/**
 * Update statistics display
 */
function updateStats() {
  const totalCount = allSubmissions.length;
  const unreadCount = allSubmissions.filter(s => !s.is_read).length;

  const totalElement = document.getElementById('totalCount');
  const unreadElement = document.getElementById('unreadCount');

  if (totalElement) {
    totalElement.textContent = totalCount;
  }

  if (unreadElement) {
    unreadElement.textContent = unreadCount;
  }
}

/**
 * Show error message
 */
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

/**
 * Format date to readable format
 */
function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
