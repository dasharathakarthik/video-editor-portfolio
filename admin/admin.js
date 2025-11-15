// admin/admin.js

// Portfolio default categories (used to seed admin panel if Firestore is empty)
var DEFAULT_PORTFOLIO_CATEGORIES = [
  "Reels Edit",
  "YouTube Edit",
  "Ads Edit",
  "3D Model Integration",
  "3D Layers Edit",
  "Cinematography"
];

// ===== Auth guard =====

// Guard all admin pages except login
auth.onAuthStateChanged(function (user) {
  if (!user) {
    // Not authenticated → redirect to login (relative path)
    window.location.href = "login.html";
  } else {
    // Authenticated → initialize UI
    var chip = document.getElementById("user-chip");
    if (chip && user.email) {
      chip.innerHTML =
        '<span>' +
        user.email +
        "</span><span style=\"width:6px;height:6px;border-radius:50%;background:#34d399\"></span>";
    }
    initializeAdmin();
  }
});

// ===== Navigation / layout =====

function initializeAdmin() {
  setupSidebar();
  setupLogout();
  setupAddVideo();
  setupManageVideos();
  setupCategories();
}

// Sidebar navigation
function setupSidebar() {
  var sidebarToggle = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  var links = document.querySelectorAll(".nav-link");
  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var targetId = link.getAttribute("data-target");
      if (!targetId) return;

      links.forEach(function (l) {
        l.classList.remove("active");
      });
      link.classList.add("active");

      var sections = document.querySelectorAll("main section.section-card");
      sections.forEach(function (s) {
        s.classList.add("hidden");
      });

      var targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.remove("hidden");
      }

      // Close sidebar on mobile
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  });
}

// Logout
function setupLogout() {
  var logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", function () {
    auth
      .signOut()
      .then(function () {
        // After logout, go back to login page in the same folder
        window.location.href = "login.html";
      })
      .catch(function (error) {
        console.error("Logout failed:", error);
      });
  });
}

// ===== Shared utilities =====

// Extract YouTube ID from URL or raw ID
function extractYouTubeId(input) {
  if (!input) return null;
  input = input.trim();

  // If it looks like a bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  var url;
  try {
    url = new URL(input);
  } catch (e) {
    return null;
  }

  if (url.hostname === "youtu.be") {
    return url.pathname.replace("/", "");
  }

  if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
    var v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
    }
  }

  return null;
}

// Build YouTube thumbnail URL
function youtubeThumbUrl(id) {
  return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
}

// Global caches
var allVideos = []; // { id, data }
var allCategories = []; // { id, data }

// ===== Dashboard stats (computed from caches) =====

function updateStats() {
  var statTotalVideos = document.getElementById("stat-total-videos");
  var statTotalCategories = document.getElementById("stat-total-categories");
  var statTopCategory = document.getElementById("stat-top-category");

  if (statTotalVideos) statTotalVideos.textContent = allVideos.length.toString();
  if (statTotalCategories) statTotalCategories.textContent = allCategories.length.toString();

  // Compute most populated category
  var counts = {};
  allVideos.forEach(function (v) {
    var cat = (v.data.category || "Uncategorized").toString();
    counts[cat] = (counts[cat] || 0) + 1;
  });

  var topCat = "–";
  var topCount = 0;
  Object.keys(counts).forEach(function (c) {
    if (counts[c] > topCount) {
      topCount = counts[c];
      topCat = c + " (" + counts[c] + ")";
    }
  });

  if (statTopCategory) statTopCategory.textContent = topCat;
}

// ===== Add Video =====

function setupAddVideo() {
  var form = document.getElementById("add-video-form");
  var urlInput = document.getElementById("input-youtube-url");
  var categorySelect = document.getElementById("input-category");
  var titleInput = document.getElementById("input-title");
  var descInput = document.getElementById("input-description");
  var statusEl = document.getElementById("add-video-status");
  var btn = document.getElementById("btn-add-video");
  var thumbPreview = document.getElementById("thumbnail-preview");

  if (!form) return;

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (type ? " " + type : "");
  }

  // Populate categories in dropdown (reactive to categories snapshot)
  function refreshCategoryOptions() {
    if (!categorySelect) return;
    var value = categorySelect.value;
    categorySelect.innerHTML = "";
    allCategories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.data.name;
      opt.textContent = c.data.name;
      categorySelect.appendChild(opt);
    });
    if (value) {
      categorySelect.value = value;
    }
  }

  // Re-render categories when cache changes
  window._refreshCategoryOptionsForAddVideo = refreshCategoryOptions;

  // Thumbnail preview on URL change
  if (urlInput && thumbPreview) {
    urlInput.addEventListener("input", function () {
      var id = extractYouTubeId(urlInput.value);
      thumbPreview.innerHTML = "";
      if (id) {
        var img = document.createElement("img");
        img.src = youtubeThumbUrl(id);
        img.alt = "YouTube thumbnail";
        thumbPreview.appendChild(img);
      } else {
        var div = document.createElement("div");
        div.className = "placeholder";
        div.textContent = "Thumbnail preview will appear here";
        thumbPreview.appendChild(div);
      }
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    if (!btn) return;

    var id = extractYouTubeId(urlInput.value);
    if (!id) {
      setStatus("Invalid YouTube link or ID.", "error");
      return;
    }

    var category = categorySelect.value;
    var title = titleInput.value.trim();
    var description = descInput.value.trim();

    if (!category || !title || !description) {
      setStatus("All fields are required.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Adding…";

    db.collection("videos")
      .add({
        youtube_id: id,
        title: title,
        description: description,
        category: category,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(function () {
        setStatus("Video added successfully.", "success");
        form.reset();
        if (thumbPreview) {
          thumbPreview.innerHTML =
            '<div class="placeholder">Thumbnail preview will appear here</div>';
        }
      })
      .catch(function (error) {
        console.error("Error adding video:", error);
        setStatus("Failed to add video. Check console for details.", "error");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Add Video";
      });
  });
}

// ===== Manage Videos =====

var editModalState = {
  currentId: null
};
var deleteModalState = {
  currentId: null
};

function setupManageVideos() {
  var container = document.getElementById("videos-container");
  var filterCategory = document.getElementById("filter-category");
  var filterSearch = document.getElementById("filter-search");
  var filterSort = document.getElementById("filter-sort");
  var statusEl = document.getElementById("manage-videos-status");

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (type ? " " + type : "");
  }

  // Populate category filter from categories cache
  function refreshFilterCategories() {
    if (!filterCategory) return;
    var current = filterCategory.value;
    filterCategory.innerHTML = '<option value="">All categories</option>';
    allCategories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.data.name;
      opt.textContent = c.data.name;
      filterCategory.appendChild(opt);
    });
    if (current) {
      filterCategory.value = current;
    }
  }
  window._refreshFilterCategoriesForVideos = refreshFilterCategories;

  function renderVideos() {
    if (!container) return;
    container.innerHTML = "";

    var categoryVal = filterCategory ? filterCategory.value : "";
    var searchVal = filterSearch ? filterSearch.value.toLowerCase().trim() : "";
    var sortVal = filterSort ? filterSort.value : "newest";

    var vids = allVideos.slice(); // copy
    // Filter
    vids = vids.filter(function (v) {
      var matchCat = !categoryVal || v.data.category === categoryVal;
      var matchSearch =
        !searchVal ||
        (v.data.title || "").toString().toLowerCase().indexOf(searchVal) !== -1;
      return matchCat && matchSearch;
    });

    // Sort
    vids.sort(function (a, b) {
      var ta = a.data.created_at ? a.data.created_at.toMillis() : 0;
      var tb = b.data.created_at ? b.data.created_at.toMillis() : 0;
      if (sortVal === "newest") {
        return tb - ta;
      } else {
        return ta - tb;
      }
    });

    if (!vids.length) {
      setStatus("No videos found for current filters.", "");
      return;
    } else {
      setStatus("", "");
    }

    vids.forEach(function (v) {
      var card = document.createElement("div");
      card.className = "video-card";

      var img = document.createElement("img");
      img.src = youtubeThumbUrl(v.data.youtube_id);
      img.alt = v.data.title || "Video thumbnail";
      card.appendChild(img);

      var body = document.createElement("div");
      body.className = "video-body";

      var title = document.createElement("div");
      title.className = "video-title";
      title.textContent = v.data.title || "(untitled)";
      body.appendChild(title);

      var meta = document.createElement("div");
      meta.className = "video-meta";
      meta.textContent =
        (v.data.category || "Uncategorized") +
        (v.data.created_at
          ? " • " + v.data.created_at.toDate().toLocaleDateString()
          : "");
      body.appendChild(meta);

      var actions = document.createElement("div");
      actions.className = "video-actions";

      var editBtn = document.createElement("button");
      editBtn.className = "btn btn-ghost";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        openEditModal(v);
      });

      var deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-primary";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        openDeleteModal(v.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      body.appendChild(actions);
      card.appendChild(body);

      container.appendChild(card);
    });
  }

  // Filters events
  if (filterCategory) filterCategory.addEventListener("change", renderVideos);
  if (filterSearch)
    filterSearch.addEventListener("input", function () {
      renderVideos();
    });
  if (filterSort) filterSort.addEventListener("change", renderVideos);

  // Listen to videos collection in real time
  db.collection("videos").onSnapshot(
    function (snapshot) {
      allVideos = [];
      snapshot.forEach(function (doc) {
        allVideos.push({ id: doc.id, data: doc.data() });
      });
      updateStats();
      renderVideos();
    },
    function (error) {
      console.error("Error listening to videos:", error);
      setStatus("Failed to load videos. Check console.", "error");
    }
  );

  // Edit modal logic
  var modalBackdropEdit = document.getElementById("modal-backdrop-edit");
  var btnCloseEdit = document.getElementById("btn-close-edit-modal");
  var btnCancelEdit = document.getElementById("btn-cancel-edit");
  var editForm = document.getElementById("edit-video-form");
  var editTitle = document.getElementById("edit-title");
  var editDescription = document.getElementById("edit-description");
  var editCategory = document.getElementById("edit-category");
  var editStatus = document.getElementById("edit-video-status");
  var btnSaveEdit = document.getElementById("btn-save-edit");

  function setEditStatus(msg, type) {
    if (!editStatus) return;
    editStatus.textContent = msg || "";
    editStatus.className = "status" + (type ? " " + type : "");
  }

  function refreshEditCategoryOptions() {
    if (!editCategory) return;
    var value = editCategory.value;
    editCategory.innerHTML = "";
    allCategories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.data.name;
      opt.textContent = c.data.name;
      editCategory.appendChild(opt);
    });
    if (value) {
      editCategory.value = value;
    }
  }
  window._refreshEditCategoryOptionsForVideos = refreshEditCategoryOptions;

  function openEditModal(video) {
    editModalState.currentId = video.id;
    if (editTitle) editTitle.value = video.data.title || "";
    if (editDescription) editDescription.value = video.data.description || "";
    refreshEditCategoryOptions();
    if (editCategory && video.data.category) {
      editCategory.value = video.data.category;
    }
    setEditStatus("");
    if (modalBackdropEdit) modalBackdropEdit.classList.add("active");
  }

  function closeEditModal() {
    editModalState.currentId = null;
    if (modalBackdropEdit) modalBackdropEdit.classList.remove("active");
  }

  if (btnCloseEdit) btnCloseEdit.addEventListener("click", closeEditModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeEditModal);

  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!editModalState.currentId) return;

      var title = editTitle.value.trim();
      var desc = editDescription.value.trim();
      var category = editCategory.value;

      if (!title || !desc || !category) {
        setEditStatus("All fields are required.", "error");
        return;
      }

      btnSaveEdit.disabled = true;
      btnSaveEdit.textContent = "Saving…";

      db.collection("videos")
        .doc(editModalState.currentId)
        .update({
          title: title,
          description: desc,
          category: category
        })
        .then(function () {
          setEditStatus("Updated successfully.", "success");
          setTimeout(closeEditModal, 500);
        })
        .catch(function (error) {
          console.error("Error updating video:", error);
          setEditStatus("Failed to update video.", "error");
        })
        .finally(function () {
          btnSaveEdit.disabled = false;
          btnSaveEdit.textContent = "Save Changes";
        });
    });
  }

  // Delete modal logic
  var modalBackdropDelete = document.getElementById("modal-backdrop-delete");
  var btnCancelDelete = document.getElementById("btn-cancel-delete");
  var btnConfirmDelete = document.getElementById("btn-confirm-delete");

  function openDeleteModal(id) {
    deleteModalState.currentId = id;
    if (modalBackdropDelete) modalBackdropDelete.classList.add("active");
  }

  function closeDeleteModal() {
    deleteModalState.currentId = null;
    if (modalBackdropDelete) modalBackdropDelete.classList.remove("active");
  }

  if (btnCancelDelete) btnCancelDelete.addEventListener("click", closeDeleteModal);

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", function () {
      if (!deleteModalState.currentId) return;
      btnConfirmDelete.disabled = true;
      btnConfirmDelete.textContent = "Deleting…";

      db.collection("videos")
        .doc(deleteModalState.currentId)
        .delete()
        .then(function () {
          closeDeleteModal();
        })
        .catch(function (error) {
          console.error("Error deleting video:", error);
          alert("Failed to delete video. See console.");
        })
        .finally(function () {
          btnConfirmDelete.disabled = false;
          btnConfirmDelete.textContent = "Delete";
        });
    });
  }

  // Initial render
  renderVideos();
}

// ===== Categories management =====

function setupCategories() {
  var form = document.getElementById("add-category-form");
  var input = document.getElementById("input-category-name");
  var list = document.getElementById("category-list");
  var statusEl = document.getElementById("categories-status");

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (type ? " " + type : "");
  }

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = input.value.trim();
    if (!name) return;

    // order = length (append at end)
    var nextOrder = allCategories.length;

    db.collection("categories")
      .add({
        name: name,
        order: nextOrder
      })
      .then(function () {
        input.value = "";
        setStatus("Category added.", "success");
      })
      .catch(function (error) {
        console.error("Error adding category:", error);
        setStatus("Failed to add category.", "error");
      });
  });

  // Listen to categories
  db.collection("categories")
    .orderBy("order", "asc")
    .onSnapshot(
      function (snapshot) {
        allCategories = [];
        snapshot.forEach(function (doc) {
          allCategories.push({ id: doc.id, data: doc.data() });
        });

        // If no categories exist yet, seed with the portfolio's default set once
        if (!allCategories.length && !window.__ADMIN_DEFAULT_CATEGORIES_SEEDED__) {
          window.__ADMIN_DEFAULT_CATEGORIES_SEEDED__ = true;
          DEFAULT_PORTFOLIO_CATEGORIES.forEach(function (name, index) {
            db.collection("categories").add({
              name: name,
              order: index
            });
          });
        }

        updateStats();
        renderCategories();

        // Notify other modules to refresh their category dropdowns
        if (window._refreshCategoryOptionsForAddVideo) {
          window._refreshCategoryOptionsForAddVideo();
        }
        if (window._refreshFilterCategoriesForVideos) {
          window._refreshFilterCategoriesForVideos();
        }
        if (window._refreshEditCategoryOptionsForVideos) {
          window._refreshEditCategoryOptionsForVideos();
        }
      },
      function (error) {
        console.error("Error listening to categories:", error);
        setStatus("Failed to load categories.", "error");
      }
    );

  function renderCategories() {
    if (!list) return;
    list.innerHTML = "";

    allCategories.forEach(function (c) {
      var li = document.createElement("li");
      li.className = "category-item";
      li.draggable = true;
      li.dataset.id = c.id;

      var handle = document.createElement("span");
      handle.className = "category-handle";
      handle.textContent = "⠿";

      var nameInput = document.createElement("input");
      nameInput.className = "category-name-input";
      nameInput.value = c.data.name || "";
      nameInput.addEventListener("change", function () {
        var newName = nameInput.value.trim();
        if (!newName) return;
        db.collection("categories").doc(c.id).update({ name: newName });
      });

      var buttons = document.createElement("div");
      buttons.className = "category-buttons";

      var deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-ghost";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        attemptDeleteCategory(c.id, c.data.name);
      });

      buttons.appendChild(deleteBtn);

      li.appendChild(handle);
      li.appendChild(nameInput);
      li.appendChild(buttons);

      list.appendChild(li);
    });

    attachDragAndDrop(list);
  }

  // Delete category only if no videos reference it
  function attemptDeleteCategory(categoryId, categoryName) {
    if (
      !confirm(
        'Delete category "' +
          categoryName +
          '"? It will be removed only if there are no videos using it.'
      )
    ) {
      return;
    }

    db.collection("videos")
      .where("category", "==", categoryName)
      .get()
      .then(function (snapshot) {
        if (!snapshot.empty) {
          alert("Cannot delete category: there are videos using this category.");
          return;
        }

        return db.collection("categories").doc(categoryId).delete();
      })
      .then(function () {
        // ok
      })
      .catch(function (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category. See console.");
      });
  }

  // Drag & drop reorder
  function attachDragAndDrop(listEl) {
    var dragSrcEl = null;

    listEl.querySelectorAll(".category-item").forEach(function (item) {
      item.addEventListener("dragstart", function (e) {
        dragSrcEl = item;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", function () {
        item.classList.remove("dragging");
      });

      item.addEventListener("dragover", function (e) {
        e.preventDefault();
        var bounding = item.getBoundingClientRect();
        var offset = bounding.y + bounding.height / 2;
        var after = e.clientY > offset;
        if (after) {
          item.parentNode.insertBefore(dragSrcEl, item.nextSibling);
        } else {
          item.parentNode.insertBefore(dragSrcEl, item);
        }
      });
    });

    listEl.addEventListener("drop", function (e) {
      e.preventDefault();
      saveNewCategoryOrder();
    });
  }

  function saveNewCategoryOrder() {
    if (!list) return;
    var items = list.querySelectorAll(".category-item");
    var batch = db.batch();
    items.forEach(function (item, index) {
      var id = item.dataset.id;
      var ref = db.collection("categories").doc(id);
      batch.update(ref, { order: index });
    });

    batch
      .commit()
      .then(function () {
        setStatus("Category order updated.", "success");
      })
      .catch(function (error) {
        console.error("Error updating category order:", error);
        setStatus("Failed to update category order.", "error");
      });
  }
}
