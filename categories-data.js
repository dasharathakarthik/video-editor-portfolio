// categories-data.js
// Populate the homepage category grid from Firestore `categories` collection.
// Expects Firebase v8 SDK + admin/firebase-config.js to be loaded first.

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("category-grid");
    if (!grid) return;

    if (typeof db === "undefined" || !db || !firebase || !firebase.firestore) {
      // Fail silently on homepage; it will just show an empty grid.
      console.warn("categories-data: Firestore not initialized; category grid will be empty.");
      return;
    }

    // Map Firestore category names to portfolio pages and visuals
    var CATEGORY_CONFIG = {
      "Reels Edit": {
        href: "reels.html",
        label: "01",
        chip: "Short-form",
        description:
          "Snappy, scroll-stopping vertical edits built for retention and shareability.",
        icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><polygon points="10,9 10,15 15,12"></polygon></svg>'
      },
      "YouTube Edit": {
        href: "youtube.html",
        label: "02",
        chip: "YouTube",
        description:
          "Long-form storytelling with tight pacing and clean visual language.",
        icon: '<svg viewBox="0 0 24 24"><rect x="5" y="8" width="11" height="8" rx="1"></rect><polygon points="16,10 19,12 16,14"></polygon></svg>'
      },
      "Ads Edit": {
        href: "ads.html",
        label: "03",
        chip: "Commercial",
        description:
          "Commercial edits, performance-focused cutdowns, and platform-native ad formats.",
        icon: '<svg viewBox="0 0 24 24"><polygon points="5,9 14,9 18,6 18,18 14,15 5,15"></polygon><rect x="3" y="10" width="2" height="4"></rect></svg>'
      },
      "3D Model Integration": {
        href: "3dmodel.html",
        label: "04",
        chip: "3D + live action",
        description:
          "3D models composited into live-action footage with tracked motion and integrated lighting.",
        icon: '<svg viewBox="0 0 24 24"><polygon points="12,4 6,8 12,12 18,8"></polygon><polygon points="6,8 6,16 12,20 12,12"></polygon><polygon points="18,8 18,16 12,20 12,12"></polygon></svg>'
      },
      "3D Layers Edit": {
        href: "3dlayers.html",
        label: "05",
        chip: "Motion graphics",
        description:
          "Advanced 3D layers, parallax motion, and dimensional typography for intros and titles.",
        icon: '<svg viewBox="0 0 24 24"><polygon points="12,5 4,9 12,13 20,9"></polygon><polygon points="12,13 5,9.5 5,12 12,16 19,12 19,9.5"></polygon></svg>'
      },
      Cinematography: {
        href: "cinematography.html",
        label: "06",
        chip: "Direction &amp; camera",
        description:
          "Shot, framed, and edited sequences focused on light, movement, and storytelling.",
        icon: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="14" height="10" rx="1"></rect><circle cx="8" cy="12" r="1.5"></circle><circle cx="14" cy="12" r="1.5"></circle></svg>'
      }
    };

    function createCard(configKey, name, orderIndex) {
      var conf = CATEGORY_CONFIG[configKey] || CATEGORY_CONFIG[name] || null;
      if (!conf) {
        // Unknown category name: skip rendering on homepage
        return null;
      }

      var a = document.createElement("a");
      a.className = "category-card";
      a.href = conf.href;

      var inner = document.createElement("div");
      inner.className = "category-card-inner";

      var header = document.createElement("div");
      header.className = "category-header";

      var label = document.createElement("div");
      label.className = "category-label";
      label.textContent = conf.label || String(orderIndex + 1).padStart(2, "0");

      var iconSpan = document.createElement("span");
      iconSpan.className = "category-icon";
      iconSpan.setAttribute("aria-hidden", "true");
      iconSpan.innerHTML = conf.icon;

      var h3 = document.createElement("h3");
      h3.textContent = name;

      header.appendChild(label);
      header.appendChild(iconSpan);
      header.appendChild(h3);

      var p = document.createElement("p");
      p.textContent = conf.description || "Curated work in this category.";

      var chip = document.createElement("span");
      chip.className = "category-chip";
      chip.innerHTML = conf.chip || "Featured";

      inner.appendChild(header);
      inner.appendChild(p);
      inner.appendChild(chip);

      a.appendChild(inner);
      return a;
    }

    db.collection("categories")
      .orderBy("order", "asc")
      .get()
      .then(function (snapshot) {
        grid.innerHTML = "";

        if (snapshot.empty) {
          // No categories configured; nothing to render
          return;
        }

        var index = 0;
        snapshot.forEach(function (doc) {
          var data = doc.data() || {};
          var name = data.name || "";
          if (!name) return;

          var card = createCard(name, name, index);
          if (card) {
            grid.appendChild(card);
            index += 1;
          }
        });
      })
      .catch(function (error) {
        console.error("categories-data: failed to load categories from Firestore", error);
      });
  });
})();
