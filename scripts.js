// Smooth scroll function
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        // Add active class to clicked link
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');

        // Smooth scroll with wind effect
        targetSection.scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Play wind sound function
function playWindSound() {
    const wind = document.getElementById('windSound');
    wind.currentTime = 0; // Reset sound to start
    wind.volume = 0.3; // Adjust volume (30%)
    wind.play();
}

// Add scroll spy to highlight current section in navigation
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 60) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentSection) {
            link.classList.add('active');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after 3 seconds
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        loadingScreen.classList.add('fade-out');
        // Remove loading screen from DOM after fade out
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 3000);

    // Verify API key is loaded
    if (!HUGGING_FACE_API_KEY || HUGGING_FACE_API_KEY.includes('your')) {
        console.error('API Key not properly configured!');
        addMessage("Configuration Error: API key not properly set up. Please check the configuration.", 'bot');
        return;
    }
    
    const chatInterface = document.getElementById('chat-interface');
    const startBrewingBtn = document.querySelector('.cta-button');
    const chatInput = document.querySelector('.chat-input textarea');
    const sendButton = document.querySelector('.send-message');
    const chatMessages = document.querySelector('.chat-messages');
    const minimizeBtn = document.querySelector('.minimize-chat');

    // Show chat interface when clicking Start Brewing
    startBrewingBtn.addEventListener('click', function() {
        startBrewingBtn.style.opacity = '0';
        setTimeout(() => {
            startBrewingBtn.style.display = 'none';
            chatInterface.classList.remove('hidden');
            setTimeout(() => chatInterface.classList.add('visible'), 100);
        }, 300);
    });

    // Minimize chat
    minimizeBtn.addEventListener('click', function() {
        chatInterface.classList.remove('visible');
        setTimeout(() => {
            chatInterface.classList.add('hidden');
            startBrewingBtn.style.display = 'inline-block';
            setTimeout(() => startBrewingBtn.style.opacity = '1', 100);
        }, 300);
    });

    // Handle sending messages
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        chatInput.value = '';

        // Simulate AI thinking with typing indicator
        addTypingIndicator();

        // Generate AI response
        setTimeout(() => {
            removeTypingIndicator();
            generateAIResponse(message);
        }, 1500);
    }

    // Send message on button click or Enter key
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Add message to chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <img src="images/brewbot-logo.svg" alt="BrewBot" class="bot-avatar">
                <div class="message-content">${content}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add typing indicator
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = `
            <img src="images/brewbot-logo.svg" alt="BrewBot" class="bot-avatar">
            <div class="message-content">BrewBot is thinking...</div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Generate AI response
    async function generateAIResponse(userMessage) {
        try {
            addTypingIndicator();

            const response = await fetch(
                "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
                {
                    headers: {
                        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: `You are BrewBot, an expert drink recipe creator. Create a detailed beverage recipe based on this request: "${userMessage}"

                        Follow this format strictly:
                        Drink Name: [creative name for the drink]
                        
                        Ingredients:
                        - [list each ingredient with specific measurements]
                        
                        Instructions:
                        1. [Step-by-step instructions]
                        2. [Continue steps]
                        
                        Serving Suggestion:
                        [How to serve and garnish]
                        
                        Remember to be creative and detailed, focusing only on beverage recipes.`
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("API Response:", result);

            removeTypingIndicator();

            let aiResponse = result[0].generated_text || result.generated_text;
            
            // Clean up and format the response
            aiResponse = `🍹 Here's your personalized drink recipe:\n\n${aiResponse}\n\n💭 Would you like me to modify this recipe or create something else?`;
            
            addMessage(aiResponse, 'bot');

        } catch (error) {
            console.error("Detailed Error:", error);
            removeTypingIndicator();
            addMessage("I apologize for the error. I'm currently experiencing technical difficulties. Please try again in a few moments. Error details: " + error.message, 'bot');
        }
    }

    // Add this helper function to format the response
    function formatRecipeResponse(response) {
        // Add emoji and formatting
        const formattedResponse = `🍹 Here's your personalized drink recipe:\n\n${response}`;
        
        // Add some basic formatting if the AI didn't structure it
        if (!response.includes('Ingredients:')) {
            return `${formattedResponse}\n\n💭 Let me know if you'd like me to modify this recipe!`;
        }
        
        return formattedResponse;
    }

    // Update the chat input to handle longer responses
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}); 