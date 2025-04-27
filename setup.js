const { execSync } = require('child_process');
const os = require('os');

function checkMacOSVoices() {
    try {
        const voices = execSync('say -v ?').toString();
        console.log('\nAvailable voices on your system:');
        
        // Check for Indian language voices
        const indianVoices = voices.split('\n')
            .filter(line => {
                const lowercaseLine = line.toLowerCase();
                return lowercaseLine.includes('hindi') ||
                       lowercaseLine.includes('tamil') ||
                       lowercaseLine.includes('telugu') ||
                       lowercaseLine.includes('kannada') ||
                       lowercaseLine.includes('malayalam') ||
                       lowercaseLine.includes('bengali') ||
                       lowercaseLine.includes('gujarati') ||
                       lowercaseLine.includes('marathi') ||
                       lowercaseLine.includes('lekha') ||
                       lowercaseLine.includes('rishi');
            });

        if (indianVoices.length > 0) {
            console.log('\nFound Indian language voices:');
            indianVoices.forEach(voice => console.log(voice));
        } else {
            console.log('\nNo Indian language voices found. The app will use default system voice.');
            console.log('To improve Indian language support, you can:');
            console.log('1. Go to System Settings > Siri & Dictation');
            console.log('2. Click on "System Voices"');
            console.log('3. Install additional voices for Indian languages');
        }
    } catch (error) {
        console.error('Error checking voices:', error.message);
    }
}

function checkWindowsSpeech() {
    try {
        execSync('powershell "Add-Type -AssemblyName System.Speech"');
        console.log('Windows speech synthesis is available.');
        console.log('Note: Indian language support depends on installed Windows language packs.');
        console.log('To improve support, install Indian language packs from Windows Settings.');
    } catch (error) {
        console.error('Error checking Windows speech:', error.message);
    }
}

function checkLinuxSpeech() {
    try {
        execSync('which espeak');
        console.log('espeak is available for text-to-speech.');
    } catch {
        console.log('espeak is not installed. Installing...');
        try {
            // Try apt-get first
            execSync('sudo apt-get update && sudo apt-get install -y espeak');
        } catch {
            try {
                // Try yum if apt-get fails
                execSync('sudo yum install -y espeak');
            } catch {
                console.error('Could not install espeak. Please install it manually.');
            }
        }
    }
}

async function main() {
    console.log('Checking text-to-speech capabilities...');
    
    const platform = os.platform();
    
    try {
        switch (platform) {
            case 'darwin':
                checkMacOSVoices();
                break;
            case 'win32':
                checkWindowsSpeech();
                break;
            case 'linux':
                checkLinuxSpeech();
                break;
            default:
                console.error('Unsupported platform:', platform);
                process.exit(1);
        }
        
        console.log('\nSetup completed! The application will use available system voices.');
    } catch (error) {
        console.error('Setup check failed:', error);
        process.exit(1);
    }
}

main();
