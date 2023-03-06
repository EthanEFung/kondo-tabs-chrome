
const $ = selector => document.querySelector(selector)
const allTabs = () => chrome.tabs.query({})
const currTab = () => chrome.tabs.getCurrent()
const removeClass = css => elem => elem.classList.remove(css)

const template = $("template#card-template")

const card = (tab, i) => {
    const doc = template.content.cloneNode(true)
    const card = doc.querySelector(".card")
    const favicon = card.querySelector(".favicon")
    const title = card.querySelector(".title")
    const url = card.querySelector(".url")
    const remove = card.querySelector(".remove")

    Object.keys(tab).map((k) => {
        card.dataset[k] = tab[k]
    })

    favicon.src = tab.favIconUrl;
    title.textContent = tab.title
    url.textContent = tab.url
    remove.dataset.id = tab.id

    if (i === 0) {
        // it's not pretty but it'll do
        removeClass("mt-3")(card)
    }

    onClick(removeTab)(remove) // append clickhandler
    return card
}

const appendToList = elem => {
    const list = $("#list")
    list.append(elem)
    return elem
}

const removeChildren = elem => {
    while (elem.children.length) {
        elem.lastChild.remove()
    }
}

const removeSelf = elem => elem.remove()

const withListener = type => cb => elem => {
    elem.addEventListener(type, cb)
    return elem
}

const onClick = withListener('click')

const removeTab = async e => {
    e.stopPropagation()
    const target = e.target
    const tabId = Number(target.dataset.id)
    await chrome.tabs.remove(tabId)
    removeSelf($(`.card[data-id="${tabId}"`))
}

const updateTab = async e => {
    e.stopPropagation()
    const target = e.target
    const curr = await currTab()
    const tabId = Number(target.dataset.id)
    const winId = curr.windowId
    await chrome.tabs.move(tabId, {
        index: -1,
        windowId: winId,
    });
    await chrome.tabs.update(tabId, { active: true, highlighted: true })
    await chrome.tabs.remove(curr.id)

    target.remove()
}

document.addEventListener("DOMContentLoaded", async () => {
    // first lets see if there are any chrome://newtabs open
    // and remove them if they're there
    let tabs = await allTabs()
    const curr = await currTab()
    tabs.forEach(tab => {
        if (tab.url === "chrome://newtab/" && curr.id !== tab.id) {
            chrome.tabs.remove(tab.id)
        }
    })
    removeChildren($("#list"))
    tabs = await allTabs()

    // otherwise we'll render a new tab
    tabs
        .filter(tab => !tab.active || tab.windowId !== curr.windowId)
        .map(card)
        .map(onClick(updateTab))
        .map(appendToList)
})
