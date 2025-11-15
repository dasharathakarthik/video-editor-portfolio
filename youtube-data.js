// youtube-data.js

// This script populates the YouTube category page from Firestore.
// It expects Firebase v8 SDK + admin/firebase-config.js to be loaded first.

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector(".video-grid");
    if (!grid) return;

    // Each category page sets data-category on its video-grid, e.g. "Reels Edit" or "Ads Edit".
    var targetCategory = grid.getAttribute("data-category") || null;

    // Status element (optional)
    var status = document.createElement("div");
    status.className = "status";
    grid.parentNode.insertBefore(status, grid);

    function setStatus(msg, type) {
      if (!status) return;
      status.textContent = msg || "";
      status.className = "status" + (type ? " " + type : "");
    }

    if (typeof db === "undefined" || !db || !firebase || !firebase.firestore) {
      setStatus("Video data is unavailable (Firestore not initialized).", "error");
      return;
    }

    setStatus("Loading videos…", "");

    // Build query: if a target category is set, filter by that category.
    var query = db.collection("videos");
    if (targetCategory) {
      query = query.where("category", "==", targetCategory);
    }

    query
      .get()
      .then(function (snapshot) {
        var items = [];
        snapshot.forEach(function (doc) {
          var data = doc.data() || {};
          items.push({ id: doc.id, data: data });
        });

        // Sort client-side by created_at desc if available
        items.sort(function (a, b) {
          var ta = a.data.created_at ? a.data.created_at.toMillis() : 0;
          var tb = b.data.created_at ? b.data.created_at.toMillis() : 0;
          return tb - ta;
        });

        grid.innerHTML = "";

        if (!items.length) {
          setStatus("No videos found yet for this category. Add some from the admin panel.", "");
          return;
        }

        setStatus("", "");

        items.forEach(function (item) {
          var v = item.data;
          var youtubeId = v.youtube_id;
          if (!youtubeId) return;

          var youtubeUrl = "https://www.youtube.com/watch?v=" + youtubeId;

          var article = document.createElement("article");
          article.className = "video-item";

          var frame = document.createElement("div");
          frame.className = "video-frame";

          var thumb = document.createElement("div");
          thumb.className = "yt-thumb";
          // main.js will read data-video-url, extract the ID and create a muted inline player
          thumb.setAttribute("data-video-url", youtubeUrl);

          frame.appendChild(thumb);
          article.appendChild(frame);

          var h3 = document.createElement("h3");
          h3.textContent = v.title || "Portfolio Video";
          article.appendChild(h3);

          var p = document.createElement("p");
          p.textContent = v.description || "Video loaded from your admin panel.";
          article.appendChild(p);

          var meta = document.createElement("div");
          meta.className = "video-meta";
          meta.textContent = v.category ? v.category.toString() : "Uncategorized";
          article.appendChild(meta);

          grid.appendChild(article);
        });
      })
      .catch(function (error) {
        console.error("Error loading YouTube videos from Firestore:", error);
        setStatus("Failed to load YouTube videos. Check console for details.", "error");
      });
  });
})();
