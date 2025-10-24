import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for structural directives like @for
import { FormsModule } from '@angular/forms'; // Needed for two-way binding (though we'll use value access)


// --- TYPE DEFINITIONS ---
interface Recommendation {
    title: string;
    synopsis: string;
    rotten_tomatoes: string;
    imdb: string;
    release_date: string;
}


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, FormsModule], // Import necessary modules
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        /* Custom CSS for the Neon/Dark Theme, mirrored from HTML */
        :host {
            --color-bg-deep: #0a0a14;
            --color-bg-card: #11111f;
            --color-neon-blue: #38bdf8; /* sky-400 */
            --color-neon-magenta: #ec4899; /* pink-500 */
            display: block;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--color-bg-deep);
            background-image:
                linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(236, 72, 153, 0.03) 1px, transparent 1px),
                radial-gradient(circle at top, rgba(56, 189, 248, 0.05) 0%, transparent 20%);
            background-size: 20px 20px, 20px 20px, 100% 100%;
            color: #e2e8f0; /* slate-200 */
            min-height: 100vh;
            padding-bottom: 3rem;
        }


        /* Neon Glow Effect for Headers and Active Text */
        .neon-text {
            color: var(--color-neon-blue);
            text-shadow: 0 0 5px var(--color-neon-blue), 0 0 10px rgba(56, 189, 248, 0.5);
            transition: all 0.3s ease;
        }
        .neon-magenta {
            color: var(--color-neon-magenta);
            text-shadow: 0 0 5px var(--color-neon-magenta), 0 0 10px rgba(236, 72, 153, 0.5);
        }
        .neon-glow-bg {
            background: linear-gradient(90deg, var(--color-neon-blue), var(--color-neon-magenta));
            box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4), 0 0 10px rgba(236, 72, 153, 0.4);
            transition: all 0.3s ease;
        }
        .neon-glow-bg:hover {
             box-shadow: 0 4px 20px rgba(56, 189, 248, 0.8), 0 0 15px rgba(236, 72, 153, 0.8);
        }


        /* Input field focus glow */
        input:focus, select:focus {
            border-color: var(--color-neon-blue) !important;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.5) !important;
        }
        
        /* Custom styling for selected radio button */
        input[name="content_type"]:checked + div {
            background-color: var(--color-neon-magenta);
            box-shadow: 0 0 5px var(--color-neon-magenta);
            color: white;
            border-color: var(--color-neon-magenta);
        }
        
        /* Custom styling for selected category chip */
        .category-chip.selected {
            background-color: var(--color-neon-magenta);
            box-shadow: 0 0 5px var(--color-neon-magenta);
            color: white;
        }
    `],
    template: `
        <!-- Main body structure is in :host styles, but apply padding/sizing here -->
        <div class="p-4 md:p-8">
            <div id="app-container" class="max-w-xl mx-auto">
                
                <!-- Header Section -->
                <header id="main-header" class="mb-8 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white neon-text"><rect width="20" height="15" x="2" y="3" rx="2"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>
                        <div>
                            <h1 class="text-4xl font-extrabold text-white">WatchWise</h1>
                            <p class="text-xs text-gray-400 font-light ml-2 mt-0.5" style="font-size: 0.65rem;">By Abhinand</p>
                        </div>
                    </div>
                    <!-- New Search Icon -->
                    <button 
                        (click)="toggleView('search-form-view')" 
                        class="focus:outline-none transition-transform duration-300 hover:scale-110"
                        [class.hidden]="currentView() === 'search-form-view'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white neon-text"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </button>
                </header>
                
                <!-- Tagline -->
                <p [class.hidden]="currentView() !== 'search-form-view'" class="text-center mb-10 text-slate-400 text-sm font-light leading-snug tracking-wide max-w-sm mx-auto">
                    "Navigate the infinite stream. Precision recommendations for your next watch."
                </p>


                <!-- Primary View Container -->
                <div id="primary-view">
                    
                    <!-- Loading Indicator -->
                    @if (isLoading()) {
                        <div class="text-center py-12">
                            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-t-white border-blue-500"></div>
                            <p class="mt-4 text-white neon-text">Accessing the data stream...</p>
                        </div>
                    }


                    <!-- 1. Search Form View -->
                    @if (currentView() === 'search-form-view') {
                        <form (ngSubmit)="fetchRecommendations()" class="space-y-6">


                            <!-- Type Selector -->
                            <section class="p-5 rounded-xl bg-gray-900/50 shadow-xl border border-gray-700/50 space-y-4">
                                <h2 class="text-lg font-semibold text-white neon-text">Content Type</h2>
                                <div class="flex space-x-4">
                                    <label class="flex-1">
                                        <input type="radio" name="content_type" value="Movie" [checked]="contentType() === 'Movie'" (change)="contentType.set('Movie')" class="hidden">
                                        <div class="text-center p-3 rounded-full border-2 border-transparent bg-gray-800 transition-all duration-200 cursor-pointer text-sm font-medium hover:ring-2 hover:ring-pink-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline mr-1"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg> Movie
                                        </div>
                                    </label>
                                    <label class="flex-1">
                                        <input type="radio" name="content_type" value="Series" [checked]="contentType() === 'Series'" (change)="contentType.set('Series')" class="hidden">
                                        <div class="text-center p-3 rounded-full border-2 border-transparent bg-gray-800 transition-all duration-200 cursor-pointer text-sm font-medium hover:ring-2 hover:ring-pink-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline mr-1"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 12 7 7 2"/></svg> Series
                                        </div>
                                    </label>
                                </div>
                            </section>
                            
                            <!-- Categories -->
                            <section class="p-5 rounded-xl bg-gray-900/50 shadow-xl border border-gray-700/50 space-y-4">
                                <h2 class="text-lg font-semibold text-white neon-text flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2 text-pink-500"><path d="M15 4c-4.4 0-8 3-8 7c0 1.2.4 2.3 1 3.3l-3 6l6-3c.8.6 1.8 1 3 1c4.4 0 8-3 8-7s-3.6-7-8-7z"/></svg>
                                    <span class="text-white">Categories</span> 
                                    <span class="text-sm text-gray-500 font-normal ml-2">(Select 1 or more)</span>
                                </h2>
                                <div id="category-chips" class="flex flex-wrap gap-2">
                                    @for (category of allCategories; track category) {
                                        <div 
                                            class="category-chip bg-gray-800 text-slate-400 px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-200 text-sm font-medium hover:ring-2 hover:ring-blue-500" 
                                            [class.selected]="selectedCategories().includes(category)"
                                            (click)="toggleCategory(category)">
                                            {{ category }}
                                        </div>
                                    }
                                </div>
                            </section>


                            <!-- Language & Period Filter -->
                            <section class="p-5 rounded-xl bg-gray-900/50 shadow-xl border border-gray-700/50 space-y-4">
                                <h2 class="text-lg font-semibold text-white neon-text flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2 text-blue-500"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>
                                    Advanced Filters
                                </h2>


                                <!-- Language -->
                                <div>
                                    <label for="language" class="block text-sm font-medium text-slate-400 mb-2">Language</label>
                                    <select 
                                        id="language" 
                                        name="language" 
                                        [ngModel]="language()" 
                                        (ngModelChange)="language.set($event)"
                                        class="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 transition duration-150">
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="Japanese">Japanese</option>
                                        <option value="German">German</option>
                                        <option value="Korean">Korean</option>
                                        <option value="Mandarin">Mandarin</option>
                                    </select>
                                </div>


                                <!-- Release Period Slider -->
                                <div class="pt-4">
                                    <label for="period" class="block text-sm font-medium text-slate-400 mb-4">Release Period: <span class="neon-magenta font-bold">{{ periods[periodIndex()] }}</span></label>
                                    <input 
                                        type="range" 
                                        id="period-slider" 
                                        name="period_slider" 
                                        min="0" max="4" value="0" step="1" 
                                        [ngModel]="periodIndex()" 
                                        (ngModelChange)="periodIndex.set($event)"
                                        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg">
                                    <div class="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>All Time</span>
                                        <span>Last 10Y</span>
                                        <span>Last 5Y</span>
                                        <span>Last 2Y</span>
                                        <span>Current Year</span>
                                    </div>
                                </div>
                            </section>


                            <!-- Submit Button -->
                            <button type="submit" [disabled]="isLoading()" class="w-full p-4 rounded-xl text-lg font-bold text-white neon-glow-bg transition-all duration-300 hover:scale-[1.02]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 inline mr-2"><path d="M10.5 8.5L7.5 11.5L10.5 14.5"/><path d="M13.5 8.5L16.5 11.5L13.5 14.5"/><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"/></svg>
                                GENERATE RECOMMENDATIONS
                            </button>
                        </form>
                    }


                    <!-- 2. Results View -->
                    @if (currentView() === 'results-view') {
                        <div>
                            <h2 class="text-2xl font-extrabold text-white mb-6 neon-text">Top Recommendations</h2>
                            
                            <!-- Error Message -->
                            @if (errorMessage()) {
                                <div class="p-6 mt-6 rounded-xl bg-red-900/50 border border-red-500 text-red-300 text-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 inline mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 22h16a2 2 0 0 0 1.73-4Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                    <span>{{ errorMessage() }}</span>
                                </div>
                            }


                            <!-- Recommendation List -->
                            <div id="recommendation-list" class="space-y-6">
                                @for (item of visibleRecommendations(); track item.title) {
                                    <div class="bg-gray-800/80 p-5 rounded-2xl shadow-2xl border border-gray-700/50 transform hover:scale-[1.01] transition-all duration-300">
                                        <div class="title-synopsis-container">
                                            <h3 class="text-2xl font-extrabold mb-1 text-white">{{ item.title }}</h3>
                                            <p class="text-sm text-slate-400 mb-4 leading-relaxed">{{ item.synopsis }}</p>
                                        </div>


                                        <!-- Metadata Row -->
                                        <div class="flex justify-between items-center text-sm font-semibold mt-4">
                                            
                                            <!-- Rotten Tomatoes Score -->
                                            <div class="flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-red-500"><path d="M3 2v20l1.97-2h3.11A5 5 0 0 0 12 21a5 5 0 0 0 3.92-1.46L19 22V2z"/></svg>
                                                <span [class]="item.rotten_tomatoes === 'N/A' ? 'text-slate-500' : 'text-white'">{{ item.rotten_tomatoes }}</span>
                                            </div>
                                            
                                            <!-- IMDb Score -->
                                            <div class="flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                <span [class]="item.imdb === 'N/A' ? 'text-slate-500' : 'text-white'">{{ item.imdb }}</span>
                                            </div>


                                            <!-- Release Date -->
                                            <div class="flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-blue-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                                <span class="text-slate-300">{{ item.release_date }}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>


                            <!-- Load More Button -->
                            @if (hasMoreToLoad()) {
                                <div class="mt-8 text-center">
                                    <button 
                                        (click)="loadMore()" 
                                        class="p-3 rounded-xl text-md font-bold text-white neon-glow-bg transition-all duration-300 hover:scale-[1.02] max-w-xs mx-auto">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline mr-2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.82c-.8.8-1.5 1.74-2.02 2.76"/><path d="M16 3h5v5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.82c.8-.8 1.5-1.74 2.02-2.76"/><path d="M8 21H3v-5"/></svg> Load More Recommendations
                                    </button>
                                </div>
                            }
                        </div>
                    }


                </div>
            </div>
        </div>
    `,
})
export class App {
    // --- API CONFIG ---
    private readonly apiKey = "";
    private readonly apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" + this.apiKey;
    
    // --- CONSTANTS ---
    readonly allCategories = ['Action', 'Sci-Fi', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Romance', 'Documentary', 'Fantasy', 'Animation'];
    readonly periods = [
        'All Time (no date restriction)', 
        'in the last 10 years (2015-present)', 
        'in the last 5 years (2020-present)', 
        'in the last 2 years (2023-present)', 
        'from the current year (2025)'
    ];
    readonly itemsPerLoad = 4;


    // --- STATE (SIGNALS) ---
    currentView = signal<'search-form-view' | 'results-view' | 'loading-spinner'>('search-form-view');
    isLoading = signal<boolean>(false);
    errorMessage = signal<string | null>(null);


    // Form Signals
    contentType = signal<string>('Movie');
    selectedCategories = signal<string[]>([]);
    language = signal<string>('English');
    periodIndex = signal<number>(0);


    // Results Signals
    allRecommendations = signal<Recommendation[]>([]);
    visibleItemCount = signal<number>(0);
    
    // Derived State (Computed Signals)
    visibleRecommendations = computed(() => 
        this.allRecommendations().slice(0, this.visibleItemCount())
    );
    
    hasMoreToLoad = computed(() => 
        this.visibleItemCount() < this.allRecommendations().length
    );


    // --- UI LOGIC ---


    toggleView(view: 'search-form-view' | 'results-view' | 'loading-spinner') {
        this.currentView.set(view);
        this.isLoading.set(view === 'loading-spinner');
        this.errorMessage.set(null); // Clear errors on view change
    }


    toggleCategory(category: string) {
        this.selectedCategories.update(current => {
            const index = current.indexOf(category);
            if (index > -1) {
                return current.filter(c => c !== category);
            } else {
                return [...current, category];
            }
        });
    }


    loadMore() {
        this.visibleItemCount.update(count => 
            Math.min(count + this.itemsPerLoad, this.allRecommendations().length)
        );
    }
    
    // --- API UTILITIES (Inlined for single-file mandate) ---
    private async fetchWithRetry(url: string, payload: any, retries = 3): Promise<any> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });


                if (response.ok) {
                    return await response.json();
                } else if (response.status === 429 && i < retries - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit exceeded. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    private parseRecommendations(rawText: string): Recommendation[] {
        try {
            const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);


            if (!jsonMatch) {
                console.error("Could not find a valid JSON array in API response.");
                return [];
            }


            let jsonString = jsonMatch[0];
            jsonString = jsonString.replace(/,\s*([\}\]])/g, '$1'); // Clean trailing commas
            
            const data: any[] = JSON.parse(jsonString);


            if (!Array.isArray(data)) {
                console.error("Parsed data is not an array.");
                return [];
            }
            
            return data.map(item => {
                const cleanScore = (score: any): string => {
                    if (!score || typeof score !== 'string') return 'N/A';
                    const match = score.match(/(\d+(\.\d+)?|\d+%)/);
                    return match ? match[0] : 'N/A'; 
                };


                return {
                    title: item.title || 'Untitled',
                    synopsis: item.synopsis || 'Synopsis currently unavailable.',
                    rotten_tomatoes: cleanScore(item.rotten_tomatoes) || 'N/A',
                    imdb: cleanScore(item.imdb) || 'N/A',
                    release_date: item.release_date || 'N/A',
                };
            });


        } catch (e) {
            console.error("Error parsing JSON response:", e, rawText);
            return [];
        }
    }




    // --- MAIN API CALL ---
    async fetchRecommendations() {
        this.toggleView('loading-spinner');
        
        const contentType = this.contentType();
        const categories = this.selectedCategories().join(', ');
        const language = this.language();
        const period = this.periods[this.periodIndex()];
        
        const systemPrompt = `You are a world-class, precise content recommendation AI. You must return exactly 8 recommendations in a single JSON array structure.
        
        RULES:
        1. Response must ONLY contain a JSON array of 8 objects. DO NOT include any text, markdown code blocks (like \`\`\`json), or commentary outside the JSON array itself.
        2. Every object must have these five fields: 'title', 'synopsis', 'rotten_tomatoes', 'imdb', and 'release_date'.
        3. The synopsis should be exactly one sentence and engaging.
        4. The scores ('rotten_tomatoes' and 'imdb') must be provided as single numbers or percentages (e.g., '92%' or '8.8'). Use 'N/A' if the score is truly unknown or missing.
        `;
        
        const userQuery = `Find 8 ${contentType} recommendations. 
        Filters:
        - **Genres:** ${categories || 'any popular genre'}
        - **Language:** ${language}
        - **Release Period:** ${period}
        
        Format the response strictly as a JSON array of 8 objects.`;


        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };


        try {
            const result = await this.fetchWithRetry(this.apiUrl, payload);
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;


            if (!rawText) {
                throw new Error("API returned no text content.");
            }


            const recommendations = this.parseRecommendations(rawText);


            if (recommendations.length > 0) {
                this.allRecommendations.set(recommendations);
                this.visibleItemCount.set(this.itemsPerLoad); // Display first batch
                this.toggleView('results-view');
            } else {
                this.errorMessage.set(`The search failed to return structured results. Please try a different combination of filters. Raw response: ${rawText.substring(0, 200)}...`);
                this.toggleView('results-view');
            }


        } catch (error: any) {
            console.error("Full recommendation fetching error:", error);
            this.errorMessage.set(`Network or API processing error: ${error.message}. Please check your connection or try again.`);
            this.toggleView('results-view');
        }
    }
}