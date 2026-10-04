(function () {
  function dismiss(toast) {
    if (!toast || toast.dataset.dismissed === 'true') {
      return;
    }
    toast.dataset.dismissed = 'true';
    toast.classList.add('toast-hide');
    window.setTimeout(function () {
      toast.remove();
    }, 300);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toast = document.getElementById('toast');
    if (!toast) {
      return;
    }

    var close = toast.querySelector('[data-toast-close]');
    if (close) {
      close.addEventListener('click', function () {
        dismiss(toast);
      });
    }

    window.setTimeout(function () {
      dismiss(toast);
    }, 4000);
  });
})();
