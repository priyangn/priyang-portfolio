/**
 * Priyang Shukla — Portfolio scripts
 */

(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();

/* ========================
   HAMBURGER MENU TOGGLE
   ======================== */

(function () {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navbarList = document.getElementById("navbarList");
  const navLinks = document.querySelectorAll(".nav-link");

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", function () {
      hamburgerBtn.classList.toggle("active");
      navbarList.classList.toggle("active");
    });

    // Close menu when clicking on a link
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        hamburgerBtn.classList.remove("active");
        navbarList.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !hamburgerBtn.contains(event.target) &&
        !navbarList.contains(event.target)
      ) {
        hamburgerBtn.classList.remove("active");
        navbarList.classList.remove("active");
      }
    });
  }
})();

/* ========================
   CONTACT FORM HANDLING
   ======================== */

(function () {
  const contactForm = document.getElementById("contactForm");
  const successMessage = document.getElementById("successMessage");

  // Check if we're on the contact page
  if (contactForm) {
    // Add event listener for form submission
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault(); // Prevent default form submission

      // Get form values
      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("email").value;
      const subject = document.getElementById("subject").value;
      const message = document.getElementById("message").value;

      // Basic validation (HTML5 handles most of it, but just in case)
      if (fullName && email && subject && message) {
        // Send form data to Supabase
        submitContactForm({
          full_name: fullName,
          email: email,
          subject: subject,
          message: message,
        });
      }
    });
  }
})();

/* ========================
   SUPABASE FORM SUBMISSION
   ======================== */

async function submitContactForm(formData) {
  const contactForm = document.getElementById("contactForm");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");
  const submitBtn = document.getElementById("submitBtn");

  try {
    // Show loading spinner and disable submit button
    contactForm.style.display = "none";
    loadingSpinner.classList.add("show");
    submitBtn.disabled = true;

    // Insert data into contact_submissions table
    const { data, error } = await supabaseClient
      .from('contact_submissions')
      .insert([formData]);

    // Hide loading spinner
    loadingSpinner.classList.remove("show");

    if (error) {
      console.error('Error submitting form:', error);
      showErrorMessage(error.message || "There was an error submitting your message. Please try again.");
      contactForm.style.display = "flex";
      submitBtn.disabled = false;
      return;
    }

    console.log("Form successfully submitted to database:", data);

    // Show the success message
    successMessage.classList.add("show");

    // Clear the form fields
    contactForm.reset();

    // Hide success message after 5 seconds and reset form
    setTimeout(function () {
      successMessage.classList.remove("show");
      contactForm.style.display = "flex";
      submitBtn.disabled = false;
    }, 5000);

  } catch (err) {
    console.error("Unexpected error:", err);
    loadingSpinner.classList.remove("show");
    showErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    contactForm.style.display = "flex";
    submitBtn.disabled = false;
  }
}

function showErrorMessage(errorText) {
  const errorMessage = document.getElementById("errorMessage");
  const errorTextElement = document.getElementById("errorText");
  
  errorTextElement.textContent = errorText;
  errorMessage.classList.add("show");
  
  // Auto-hide error after 5 seconds
  setTimeout(function () {
    errorMessage.classList.remove("show");
  }, 5000);
}


