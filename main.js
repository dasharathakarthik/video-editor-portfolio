document.addEventListener("DOMContentLoaded", () => {
  const heroEmbed = document.querySelector(".hero-video-embed");
  const yearSpan = document.getElementById("year");

  // Helper: extract YouTube ID from full URL or bare ID
  function extractYouTubeId(input) {
    if (!input) return null;
    input = input.trim();

    // Bare video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    try {
      const url = new URL(input);
      if (url.hostname === "youtu.be") {
        return url.pathname.replace("/", "");
      }
      if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
        const v = url.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
          return v;
        }
      }
    } catch (e) {
      // not a valid URL, fall through
    }

    return null;
  }

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Scroll-to categories from hero button (home page only)
  document.querySelectorAll("[data-scroll-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSelector = btn.getAttribute("data-scroll-to");
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const offset = rect.top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
    });
  });

  /* Hero YouTube embed - load iframe only on click */

  if (heroEmbed) {
    const videoId = heroEmbed.dataset.heroVideoId;
    if (videoId) {
      const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      heroEmbed.style.backgroundImage = `url(${thumbUrl})`;

      heroEmbed.addEventListener(
        "click",
        () => {
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
          iframe.title = "YouTube video player";
          iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          iframe.allowFullscreen = true;
          heroEmbed.innerHTML = "";
          heroEmbed.appendChild(iframe);
          heroEmbed.classList.add("is-playing");
        },
        { once: true }
      );
    }
  }

  /* Lazy-loading YouTube embeds for category thumbnails.
     Use data-video-url so you can paste full YouTube links in HTML.
  */

  document.querySelectorAll(".yt-thumb").forEach((thumb) => {
    const raw = thumb.dataset.videoUrl || thumb.dataset.videoId;
    const videoId = extractYouTubeId(raw);
    if (!videoId) return;

    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    thumb.style.backgroundImage = `url(${thumbUrl})`;

    thumb.addEventListener(
      "click",
      () => {
        if (thumb.classList.contains("is-playing")) return;
        const iframe = document.createElement("iframe");
        // Play inline, muted, with no related videos at the end
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1`;
        iframe.title = "YouTube video player";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        thumb.innerHTML = "";
        thumb.appendChild(iframe);
        thumb.classList.add("is-playing");
      },
      { once: true }
    );
  });

  /* Subtle parallax on hero media */

  const parallaxTarget = document.querySelector("[data-parallax]");
  if (parallaxTarget) {
    const strength = 14;
    parallaxTarget.addEventListener("mousemove", (event) => {
      const rect = parallaxTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = y * -strength;
      const rotateY = x * strength;
      parallaxTarget.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });

    parallaxTarget.addEventListener("mouseleave", () => {
      parallaxTarget.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  }

  /* Small UX enhancement: prevent form default submit on static site */

  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      // Simple feedback; you can replace with real API or email integration
      alert("Thanks for reaching out! Connect this form to your preferred handler to receive submissions.");
    });
  }
});
