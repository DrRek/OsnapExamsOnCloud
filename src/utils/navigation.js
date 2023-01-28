export const navigate = (evt, history=[]) => {
  if(!evt.detail.external){
    if (evt.detail.href) {
      evt.preventDefault()
      history.push(evt.detail.href);
    }
  }
}

export const internal_navigate = (href, history=[]) =>
  navigate({
    preventDefault: () => {},
    detail: {
      external: false,
      href: href
    }
  }, history)