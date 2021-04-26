class OwnReact {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
    this.rootInstance = null;
  }

  static instantiate(element) {
    const { type, props } = element;
    const dom =
      typeof element === "string"
        ? document.createTextNode(element)
        : document.createElement(type);
    const isListener = name => name.startsWith("on");
    // eslint-disable-next-line no-unused-expressions
    props &&
      Object.keys(props)
        .filter(isListener)
        .forEach(name => {
          const eventType = name.toLowerCase().substring(2);
          dom.addEventListener(eventType, props[name]);
        });
    const isAttribute = name => !isListener(name) && name !== "children";
    // eslint-disable-next-line no-unused-expressions
    props &&
      Object.keys(props)
        .filter(isAttribute)
        .forEach(name => {
          dom[name] = props[name];
        });
    // Добавляем инстансы потомков
    const childElements = props?.children || [];
    const childInstances = childElements.map(OwnReact.instantiate);
    const childDoms = childInstances.map(childInstance => childInstance.dom);
    childDoms.forEach(childDom => dom.appendChild(childDom));
    const instance = { dom, element, childInstances };
    return instance;
  }

  static reconcile(parentDom, instance, element) {
    if (instance == null) {
      // Создаём инстанс
      const newInstance = this.instantiate(element);
      parentDom.appendChild(newInstance.dom);
      return newInstance;
    }
    if (element == null) {
      // Убираем инстанс
      parentDom.removeChild(instance.dom);
      return null;
    }
    if (instance.element.type === element.type) {
      // Обновляем инстанс
      updateDomProperties(instance.dom, instance.element.props, element.props);
      instance.childInstances = reconcileChildren(instance, element);
      instance.element = element;
      return instance;
    }
    // Заменяем инстанс
    const newInstance = this.instantiate(element);
    parentDom.replaceChild(newInstance.dom, instance.dom);
    return newInstance;
  }

  static render(element, container) {
    const prevInstance = this.rootInstance;
    const nextInstance = this.reconcile(container, prevInstance, element);
    this.rootInstance = nextInstance;
  }

  static createElement(type, props = {}, ...children) {
    if (typeof type === "function") {
      return type(props, children);
    }
    return {
      type,
      props: {
        ...props,
        children: children.flat(Infinity)
      }
    };
  }
}

export default OwnReact;
