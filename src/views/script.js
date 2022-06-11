document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".upload-image").forEach((formGroupEl) => {
    const valueInputEl = formGroupEl.querySelector('input[type="hidden"]');
    const fileInputEl = formGroupEl.querySelector('input[type="file"]');
    const uploadButtonEl = formGroupEl.querySelector('button[type="button"].pick');
    const resetButtonEl = formGroupEl.querySelector('button[type="button"].delete');
    const previewEl = formGroupEl.querySelector(".banner-preview");

    uploadButtonEl.addEventListener("click", () => fileInputEl.click());
    resetButtonEl.addEventListener("click", () => {
      fileInputEl.value = "";
      valueInputEl.value = "";
      previewEl.innerHTML = "";
    });
    fileInputEl.addEventListener("change", () => {
      const { files } = fileInputEl;
      const [file] = files;
      const formData = new FormData();

      formData.append("banner_image", file);

      fetch("/manage/upload", {
        method: "POST",
        body: formData,
      })
        .then((data) => data.json())
        .then(({ filename }) => {
          fileInputEl.value = "";
          valueInputEl.value = filename;

          const imageEl = document.createElement("img");
          imageEl.src = `/image/${filename}`;

          previewEl.innerHTML = "";
          previewEl.appendChild(imageEl);
        });
    });
  });

  Promise.all([
    fetch("/manage/onair").then((data) => data.json()),
    fetch("/manage/list").then((data) => data.json()),
  ]).then(([onair, list]) => {
    render(document.querySelector("#onair"), onair);
    render(document.querySelector("#list"), list);

    const id = new URLSearchParams(location.search).get("id");
    const banner = list.find((banner) => banner.id === id);

    if (banner) {
      setForm(banner);
    }
  });
});

function render(element, list) {
  const fragment = document.createDocumentFragment();

  if (list.length === 0) {
    const trEl = document.createElement("tr");
    const tdEl = document.createElement("td");

    tdEl.colSpan = 5;
    tdEl.innerText = "배너가 없습니다.";

    trEl.appendChild(tdEl);
    fragment.appendChild(trEl);
  } else {
    list
      .map((banner) => {
        const { customer, title, url, startDate, endDate, mobile } = banner;
        const trEl = document.createElement("tr");
        const tdTitleEl = document.createElement("td");
        const tdStartDateEl = document.createElement("td");
        const tdEndDateEl = document.createElement("td");
        const tdImageEl = document.createElement("td");
        const tdActionEl = document.createElement("td");

        const buttonEditEl = document.createElement("button");
        const buttonDeleteEl = document.createElement("button");

        buttonEditEl.innerText = "Edit";
        buttonDeleteEl.innerText = "Delete";
        buttonEditEl.className = buttonDeleteEl.className = "aui-button banner-action";

        buttonEditEl.addEventListener("click", () => {
          setForm(banner);
        });
        buttonDeleteEl.addEventListener("click", () => {
          if (!confirm("정말로 삭제하시겠습니까?")) {
            return;
          }

          const inputEl = document.querySelector("#delete-banner-input");

          inputEl.value = banner.id;
          inputEl.form.submit();
        });

        tdTitleEl.innerText = `${customer} - ${title}`;
        tdStartDateEl.innerText = startDate;
        tdEndDateEl.innerText = endDate;
        tdImageEl.innerHTML = `<a href="${url}" target="_blank"><img src="/image/${mobile}" width="300" /></a>`;
        tdImageEl.style.width = "100%";

        tdActionEl.appendChild(buttonEditEl);
        tdActionEl.appendChild(buttonDeleteEl);

        trEl.appendChild(tdTitleEl);
        trEl.appendChild(tdStartDateEl);
        trEl.appendChild(tdEndDateEl);
        trEl.appendChild(tdImageEl);
        trEl.appendChild(tdActionEl);

        return trEl;
      })
      .forEach((trEl) => fragment.appendChild(trEl));
  }

  element.innerHTML = "";
  element.appendChild(fragment);
}

function setForm({ id, customer, title, startDate, endDate, url, pcMain, pcAside, mobile, backgroundColor }) {
  const formEl = document.forms.namedItem("edit");

  formEl.id.value = id;
  formEl.customer.value = customer;
  formEl.title.value = title;
  formEl.startDate.value = startDate;
  formEl.endDate.value = endDate;
  formEl.url.value = url;
  formEl.pcMain.value = pcMain;
  formEl.pcAside.value = pcAside;
  formEl.mobile.value = mobile;
  formEl.backgroundColor.value = backgroundColor;

  [
    [pcMain, document.querySelector("#pc-main-preview")],
    [pcAside, document.querySelector("#pc-aside-preview")],
    [mobile, document.querySelector("#mobile-preview")],
  ].forEach(([filename, previewEl]) => {
    const imageEl = document.createElement("img");
    imageEl.src = `/image/${filename}`;

    previewEl.innerHTML = "";
    previewEl.appendChild(imageEl);
  });
}
