// API for quote version management

export async function getQuoteVersions(quoteId) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Not authenticated");
    }

    const res = await fetch(`/quotes/${quoteId}/versions`, {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch versions");
    }

    return await res.json();
}

export async function getQuoteVersion(quoteId, versionNum) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Not authenticated");
    }

    const res = await fetch(`/quotes/${quoteId}/versions/${versionNum}`, {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch version");
    }

    return await res.json();
}

export async function compareQuoteVersions(quoteId, version1, version2) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Not authenticated");
    }

    const res = await fetch(`/quotes/${quoteId}/compare?v1=${version1}&v2=${version2}`, {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
        throw new Error("Failed to compare versions");
    }

    return await res.json();
}

export async function restoreQuoteVersion(quoteId, versionNum) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Not authenticated");
    }

    const res = await fetch(`/quotes/${quoteId}/versions/${versionNum}/restore`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
        throw new Error("Failed to restore version");
    }

    return await res.json();
}
