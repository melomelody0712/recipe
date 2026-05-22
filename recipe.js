document.addEventListener("DOMContentLoaded", () => {

  // ======== DOM取得 ========
  const titleInput = document.getElementById("title");
  const ingredientsInput = document.getElementById("ingredients");
  const seasoningsInput = document.getElementById("seasonings");
  const stepsInput = document.getElementById("steps");
  const recipeList = document.getElementById("recipeList");
  const printArea = document.getElementById("printArea");
  const previewArea = document.getElementById("previewArea"); // 一覧プレビュー
  const livePreviewTitle = document.getElementById("previewTitle"); 
  const livePreviewIngredients = document.getElementById("previewIngredients"); 
  const livePreviewSeasonings = document.getElementById("previewSeasonings"); 
  const livePreviewSteps = document.getElementById("previewSteps"); 

  // ======== 状態 ========
  let recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  let selected = new Set();
  let dragIndex = null;
  let editingIndex = null;

  // ======== ローカルストレージ保存 ========
  function saveRecipes() {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }

  // ======== レシピ保存 ========
  window.saveRecipe = function () {
    if (!titleInput.value.trim()) {
      alert("レシピ名を入力してください");
      return;
    }

    const newRecipe = {
      title: titleInput.value.trim(),
      ingredients: ingredientsInput.value.trim(),
      seasonings: seasoningsInput.value.trim(),
      steps: stepsInput.value.trim()
    };

    if (editingIndex === null) {
      recipes.push(newRecipe);
    } else {
      recipes[editingIndex] = newRecipe;
      editingIndex = null;
    }

    saveRecipes();

    // 入力欄クリア
    titleInput.value = "";
    ingredientsInput.value = "";
    seasoningsInput.value = "";
    stepsInput.value = "";

    renderList();
    updateLivePreview(); // ライブプレビューも更新
  };

  // ======== レシピ一覧表示 ========
  window.renderList = function () {
    recipeList.innerHTML = "";
    selected.clear();

    recipes.forEach((r, i) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.innerHTML = `
        <input type="checkbox" onchange="toggleSelect(${i}, this.checked)">
        ${r.title}
        <button type="button" onclick="edit(${i})">編集</button>
        <button type="button" onclick="removeRecipe(${i})">削除</button>
      `;

      // 並び替え用ドラッグ
      li.ondragstart = () => dragIndex = i;
      li.ondragover = e => e.preventDefault();
      li.ondrop = () => {
        const temp = recipes[dragIndex];
        recipes[dragIndex] = recipes[i];
        recipes[i] = temp;
        saveRecipes();
        renderList();
      };

      recipeList.appendChild(li);
    });

    renderPreview(); // 一覧プレビュー更新
  };

  // ======== 一覧プレビュー ========
  function renderPreview() {
    if (!previewArea) return;
    previewArea.innerHTML = recipes.map(makeCard).join("");
  }

  // ======== ライブプレビュー（入力中に表示） ========
  function updateLivePreview() {
    if (!livePreviewTitle) return;
    livePreviewTitle.textContent = titleInput.value.trim() || "レシピ名";
    livePreviewIngredients.innerHTML = ingredientsInput.value.trim().replace(/\n/g, "<br>") || "ここに材料を入力してください";
    livePreviewSeasonings.innerHTML = seasoningsInput.value.trim().replace(/\n/g, "<br>") || "ここに調味料を入力してください";
    livePreviewSteps.innerHTML = stepsInput.value.trim().replace(/\n/g, "<br>") || "ここに手順を入力してください";
  }

  // 入力時にライブプレビュー更新
  [titleInput, ingredientsInput, seasoningsInput, stepsInput].forEach(el => {
    el.addEventListener("input", updateLivePreview);
  });

  // ======== 選択 ========
  window.toggleSelect = function (i, v) {
    if (v) selected.add(i);
    else selected.delete(i);
  };

  // ======== 編集 ========
  window.edit = function (i) {
    const r = recipes[i];
    titleInput.value = r.title;
    ingredientsInput.value = r.ingredients;
    seasoningsInput.value = r.seasonings;
    stepsInput.value = r.steps;
    editingIndex = i;
    updateLivePreview(); // 編集中もライブ反映
  };

  // ======== 削除 ========
  window.removeRecipe = function (i) {
    recipes.splice(i, 1);
    saveRecipes();
    renderList();
  };

  // ======== レシピカード作成 ========
  window.makeCard = function (r) {
    return `
      <div class="recipe-card">
        <h2>${r.title}</h2>
        <div class="block"><b>材料</b><br>${r.ingredients.replace(/\n/g,"<br>")}</div>
        <div class="block"><b>調味料</b><br>${r.seasonings.replace(/\n/g,"<br>")}</div>
        <div class="block"><b>作り方</b><br>${r.steps.replace(/\n/g,"<br>")}</div>
      </div>
    `;
  };

  // ======== 印刷 ========
  window.printAll = function () {
    printArea.innerHTML = recipes.map(makeCard).join("");
    window.print();
  };

  window.printSelected = function () {
    printArea.innerHTML = [...selected].map(i => makeCard(recipes[i])).join("");
    window.print();
  };

  // ======== データ出力/入力 ========
  window.exportData = function () {
    const blob = new Blob([JSON.stringify(recipes)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "recipes_backup.json";
    a.click();
  };

  window.importData = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      recipes = JSON.parse(reader.result);
      saveRecipes();
      renderList();
      //updateLivePreview();
    };
    reader.readAsText(file);
  };

  // ======== 初期描画 ========
  renderList();
  updateLivePreview();

});