// youtube-data.js

// This script populates the YouTube category page from Firestore.
// It expects Firebase v8 SDK + admin/firebase-config.js to be loaded first.

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector(".video-grid");
    if (!grid) return;

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

    setStatus("Loading YouTube videos…", "");

    // We fetch all videos and filter by category on the client.
    // Use the same category string you choose in the admin panel.
    var TARGET_CATEGORY = "YouTube Edit";

    db.collection("videos")
      .orderBy("created_at", "desc")
      .get()
      .then(function (snapshot) {
        var items = [];
        snapshot.forEach(function (doc) {
          var data = doc.data() || {};
          if (data.category === TARGET_CATEGORY) {
            items.push({ id: doc.id, data: data });
          }
        });

        grid.innerHTML = "";

        if (!items.length) {
          setStatus("No YouTube videos found yet. Add some from the admin panel.", "");
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
          h3.textContent = v.title || "YouTube Edit";
          article.appendChild(h3);

          var p = document.createElement("p");
          p.textContent = v.description || "Long-form edit loaded from your admin panel.";
          article.appendChild(p);

          grid.appendChild(article);
        });
      })
      .catch(function (error) {
        console.error("Error loading YouTube videos from Firestore:", error);
        setStatus("Failed to load YouTube videos. Check console for details.", "error");
      });
  });
})();
