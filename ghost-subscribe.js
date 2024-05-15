async function subscribeToGhost(email, ghostSiteBaseUrl) {
    const emailSentElement = document.getElementById('subscription-mail-sent');
    const subscriptionFormElement = document.getElementById('subscription-form');

    try {
        const result = await fetch(`${ghostSiteBaseUrl}/members/api/send-magic-link/`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ 
                email,
                emailType: "subscribe",
            }),
        });
    } catch (e) {
        console.log("Failed to subscribe", e);
    } finally {
        if(emailSentElement && subscriptionFormElement) {
            subscriptionFormElement.classList.add('hidden');
            emailSentElement.classList.remove('invisible');
        }
    }
}
