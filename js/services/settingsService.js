<div class="max-w-4xl mx-auto space-y-6 fade-in pb-20">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">Configurações da Empresa</h1>
            <p class="text-sm text-gray-500">Gerencie seus dados de pagamento e a aparência dos links públicos.</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                Ambiente Seguro
            </span>
        </div>
    </div>

    <form id="settingsForm" class="space-y-6">

        <section class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 class="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Identidade Visual (Branding)
                </h2>
                <span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Disponível no Link Público</span>
            </div>
            
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                <div class="col-span-1 text-sm text-gray-500">
                    <p class="mb-2">Este logo aparecerá no topo dos links de preenchimento enviados aos seus clientes.</p>
                    <p>Recomendamos uma imagem PNG com fundo transparente (aprox. 200x80px).</p>
                </div>

                <div class="col-span-2">
                    <div class="flex items-center gap-4">
                        <div class="relative group w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                            <img id="logoPreview" src="" alt="Logo" class="w-full h-full object-contain p-2 hidden">
                            <div id="logoPlaceholder" class="text-center p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span class="text-xs text-gray-400 font-medium">Sem Logo</span>
                            </div>
                            
                            <div id="uploadLoader" class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center hidden">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            </div>
                        </div>

                        <div class="flex-1 space-y-2">
                            <label class="block">
                                <span class="sr-only">Escolher logo</span>
                                <input type="file" id="logoInput" accept="image/*" class="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 cursor-pointer
                                "/>
                            </label>
                            <p id="uploadStatus" class="text-xs text-gray-400">Nenhum arquivo selecionado</p>
                            
                            <input type="hidden" id="logoUrl" name="logoUrl">
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="bg-white rounded-xl shadow-sm border border-gray-200">
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 class="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Financeiro & Contato
                </h2>
            </div>
            
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-bold text-gray-700 mb-1">WhatsApp da Empresa</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.297-.471-.446-.718-.595-.248-.149-.521-.025-.719.198-.198.223-7.733 1.017-.942 1.264s.371.496.842.744c4.05 2.132 5.093 2.503 6.634 3.167.953.411 2.288.375 2.924.269.843-.14 1.758-7.19 2.006-.991.248-.297.422-.496.248-.248-.174-.471-.323-.768-.472z"/></svg>
                        </div>
                        <input type="text" id="whatsapp" name="whatsapp" 
                            class="pl-10 w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                            placeholder="5588999999999">
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Apenas números (DDD + Número). Exibido nos links.</p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">% Sinal (Entrada)</label>
                    <div class="relative">
                        <input type="number" id="entryPercent" name="entryPercent" 
                            class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                            placeholder="50">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 font-bold">%</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Usado para cálculo automático do PDF.</p>
                </div>

                <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-bold text-gray-700 mb-1">Chave Pix</label>
                    <input type="text" id="pixKey" name="pixKey" 
                        class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                        placeholder="Ex: CNPJ ou Email">
                </div>

                <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-bold text-gray-700 mb-1">Nome do Beneficiário</label>
                    <input type="text" id="pixBeneficiary" name="pixBeneficiary" 
                        class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                        placeholder="Nome que aparece no banco">
                </div>

            </div>
        </section>

        <div class="flex justify-end pt-4">
            <button type="submit" id="saveSettingsBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salvar Alterações
            </button>
        </div>

    </form>
</div>
