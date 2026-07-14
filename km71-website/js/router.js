(function () {
  var pages = ["home", "verzoekjes", "over-ons", "contact"];
  var titles = {
    "home": "KM71 Jukebox Radio — Live luisteren",
    "verzoekjes": "Verzoekjes — KM71 Jukebox Radio",
    "over-ons": "Over ons — KM71 Jukebox Radio",
    "contact": "Contact — KM71 Jukebox Radio"
  };

  function showPage() {
    var current = location.hash.replace("#", "") || "home";
    if (pages.indexOf(current) === -1) current = "home";

    pages.forEach(function (page) {
      var section = document.getElementById("page-" + page);
      if (section) section.classList.toggle("active", page === current);
    });

    document.querySelectorAll(".nav-links a[data-page]").forEach(function (link) {
      if (link.dataset.page === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.title = titles[current] || titles.home;
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", showPage);
  document.addEventListener("DOMContentLoaded", showPage);
})();
