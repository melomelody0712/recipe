document.addEventListener("DOMContentLoaded", () => {

  // ======== DOM取得 ========
  const titleInput       = document.getElementById("title");
  const ingredientsInput = document.getElementById("ingredients");
  const seasoningsInput  = document.getElementById("seasonings");
  const stepsInput       = document.getElementById("steps");
  const recipeList       = document.getElementById("recipeList");
  const printArea        = document.getElementById("printArea");
  const previewArea      = document.getElementById("previewArea");

  // ======== 状態 ========
  let recipes        = JSON.parse(localStorage.getItem("recipes") || "[]");
  let selected       = new Set();
  let listDragIndex  = null;  // リスト専用
  let cardDragIndex  = null;  // カード専用
  let editingIndex   = null;

  // ======== トースト通知 ========
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // ======== ローカルストレージ保存 ========
  function saveRecipes() {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }

  // ======== レシピ保存 ========
  window.saveRecipe = function () {
    if (!titleInput.value.trim()) {
      showToast("レシピ名を入力してください");
      return;
    }

    const newRecipe = {
      title:       titleInput.value.trim(),
      ingredients: ingredientsInput.value.trim(),
      seasonings:  seasoningsInput.value.trim(),
      steps:       stepsInput.value.trim()
    };

    if (editingIndex === null) {
      recipes.push(newRecipe);
      showToast("レシピを保存しました");
    } else {
      recipes[editingIndex] = newRecipe;
      editingIndex = null;
      showToast("レシピを更新しました");
    }

    saveRecipes();
    titleInput.value = ingredientsInput.value = seasoningsInput.value = stepsInput.value = "";
    renderList();
  };

  // ======== レシピ一覧表示 ========
  window.renderList = function () {
    recipeList.innerHTML = "";
    selected.clear();

    if (recipes.length === 0) {
      const li = document.createElement("li");
      li.style.cssText = "background:transparent;border:none;box-shadow:none;cursor:default;animation:none;";
      li.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍽</div><p>レシピがまだありません</p></div>`;
      recipeList.appendChild(li);
      renderPreview();
      return;
    }

    recipes.forEach((r, i) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.style.animationDelay = `${i * 40}ms`;
      li.innerHTML = `
        <span class="drag-handle">⠿</span>
        <input type="checkbox" onchange="toggleSelect(${i}, this.checked)">
        <span class="recipe-name">${r.title}</span>
        <button type="button" class="btn-edit" onclick="edit(${i})">編集</button>
        <button type="button" class="btn-delete" onclick="removeRecipe(${i})">削除</button>
      `;

      li.addEventListener("dragstart", (e) => {
        listDragIndex = i;
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => li.classList.add("dragging"), 0);
      });

      li.addEventListener("dragend", () => {
        listDragIndex = null;
        li.classList.remove("dragging");
        recipeList.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      });

      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (listDragIndex !== null && listDragIndex !== i) li.classList.add("drag-over");
      });

      li.addEventListener("dragleave", (e) => {
        if (!li.contains(e.relatedTarget)) li.classList.remove("drag-over");
      });

      li.addEventListener("drop", (e) => {
        e.preventDefault();
        li.classList.remove("drag-over");
        if (listDragIndex === null || listDragIndex === i) return;
        const temp = recipes[listDragIndex];
        recipes[listDragIndex] = recipes[i];
        recipes[i] = temp;
        saveRecipes();
        renderList();
      });

      recipeList.appendChild(li);
    });

    renderPreview();
  };

  // ======== レシピカードプレビュー（インタラクティブ） ========
  function renderPreview() {
    if (!previewArea) return;

    if (recipes.length === 0) {
      previewArea.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍳</div><p>保存したレシピがここに表示されます</p></div>`;
      return;
    }

    previewArea.innerHTML = "";

    recipes.forEach((r, i) => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.style.animationDelay = `${i * 50}ms`;
      card.innerHTML = `
        <div class="card-actions">
          <div class="card-left-controls">
            <span class="drag-handle">⠿</span>
            <input type="checkbox" class="card-checkbox" onchange="toggleSelect(${i}, this.checked)">
          </div>
          <div class="card-action-buttons">
            <button type="button" class="btn-edit" onclick="edit(${i})">編集</button>
            <button type="button" class="btn-delete" onclick="removeRecipe(${i})">削除</button>
          </div>
        </div>
        <h3 class="card-title">${r.title}</h3>
        <div class="card-block">
          <span class="block-label">材料</span>
          <div class="block-content">${r.ingredients.replace(/\n/g, "<br>")}</div>
        </div>
        <div class="card-block">
          <span class="block-label">調味料</span>
          <div class="block-content">${r.seasonings.replace(/\n/g, "<br>")}</div>
        </div>
        <div class="card-block">
          <span class="block-label">作り方</span>
          <div class="block-content">${r.steps.replace(/\n/g, "<br>")}</div>
        </div>
      `;

      // ドラッグハンドルを掴んだときだけカードをドラッグ可能にする
      const handle = card.querySelector(".drag-handle");
      handle.addEventListener("mousedown", () => {
        card.setAttribute("draggable", "true");
      });

      card.addEventListener("dragstart", (e) => {
        cardDragIndex = i;
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => card.classList.add("dragging"), 0);
      });

      card.addEventListener("dragend", () => {
        card.removeAttribute("draggable");
        card.classList.remove("dragging");
        cardDragIndex = null;
        previewArea.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (cardDragIndex !== null && cardDragIndex !== i) card.classList.add("drag-over");
      });

      card.addEventListener("dragleave", (e) => {
        if (!card.contains(e.relatedTarget)) card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        if (cardDragIndex === null || cardDragIndex === i) return;
        const temp = recipes[cardDragIndex];
        recipes[cardDragIndex] = recipes[i];
        recipes[i] = temp;
        saveRecipes();
        renderList();
      });

      previewArea.appendChild(card);
    });
  }

  // ======== 選択 ========
  window.toggleSelect = function (i, v) {
    if (v) selected.add(i);
    else   selected.delete(i);
  };

  // ======== 編集 ========
  window.edit = function (i) {
    const r = recipes[i];
    titleInput.value       = r.title;
    ingredientsInput.value = r.ingredients;
    seasoningsInput.value  = r.seasonings;
    stepsInput.value       = r.steps;
    editingIndex = i;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ======== 削除 ========
  window.removeRecipe = function (i) {
    recipes.splice(i, 1);
    saveRecipes();
    renderList();
    showToast("レシピを削除しました");
  };

  // ======== レシピカード作成（印刷用・元のデザイン） ========
  window.makeCard = function (r) {
    return `
      <div class="recipe-card">
        <h2>${r.title}</h2>
        <div class="block"><b>材料</b><br>${r.ingredients.replace(/\n/g, "<br>")}</div>
        <div class="block"><b>調味料</b><br>${r.seasonings.replace(/\n/g, "<br>")}</div>
        <div class="block"><b>作り方</b><br>${r.steps.replace(/\n/g, "<br>")}</div>
      </div>
    `;
  };

  // ======== 印刷 ========
  window.printAll = function () {
    printArea.innerHTML = recipes.map(makeCard).join("");
    window.print();
  };

  window.printSelected = function () {
    if (selected.size === 0) {
      showToast("印刷するレシピを選択してください");
      return;
    }
    printArea.innerHTML = [...selected].map(i => makeCard(recipes[i])).join("");
    window.print();
  };

  // ======== データ出力/入力 ========
  window.exportData = function () {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "recipes_backup.json";
    a.click();
    showToast("バックアップを保存しました");
  };

  window.importData = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        recipes = JSON.parse(reader.result);
        saveRecipes();
        renderList();
        showToast("インポートが完了しました");
      } catch {
        showToast("ファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
  };

  // ======== 初期描画 ========
  renderList();

});
