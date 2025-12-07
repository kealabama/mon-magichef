import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  ChefHat,
  Clock,
  Users,
  Flame,
  Wind,
  Plus,
  Trash2,
  ChevronLeft,
  Search,
  Camera,
  Save,
  X,
  BookOpen,
  Heart,
  LayoutGrid,
  Wine,
  Soup,
  Salad,
  Fish,
  UtensilsCrossed,
  Leaf,
  Pizza,
  Carrot,
  Droplets,
  Croissant,
  Cake,
  Baby,
  Coffee,
  IceCream,
  Edit2,
  Timer,
  Sliders,
  Aperture,
  Wheat,
  Disc,
  Cookie,
  Settings,
  Check,
} from "lucide-react";

// --- Constantes ---

const CATEGORIES = [
  "Apéritifs",
  "Soupes",
  "Entrées",
  "Poissons",
  "Viandes",
  "Veggie",
  "Pâtes, Riz, Pizza",
  "Légumes",
  "Sauces",
  "Boulangerie",
  "Desserts",
  "Bébé",
  "Boissons",
  "Glaces",
];

const MAGIMIX_ACCESSORIES = [
  "Lame Universelle",
  "Pétrin XL",
  "Batteur à blancs",
  "Panier Vapeur",
  "Grand bol",
  "Midi bol",
  "Mini bol",
  "Couteau grand bol",
  "Couteau mini bol",
  "Eminceur 2mm",
  "Eminceur 4mm",
  "Râpeur 2mm",
  "Râpeur 4mm",
];

const SERVING_UNITS = [
  { value: "personnes", label: "Personnes" },
  { value: "pieces", label: "Pièces" },
];

const ROBOT_MODES = {
  Expert: {
    label: "Expert",
    icon: Sliders,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    subModes: [],
  },
  Cuisson: {
    label: "Cuisson",
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-50",
    subModes: [
      "Soupe moulinée",
      "Soupe veloutée",
      "Mijotage",
      "Rissolage",
      "Vapeur",
      "Vapeur XXL",
    ],
  },
  Blender: {
    label: "Blender",
    icon: Aperture,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    subModes: ["Dessert glacé", "Glace pilée", "Smoothie"],
  },
  Boulangerie: {
    label: "Boulangerie",
    icon: Wheat,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    subModes: ["Pâte/gâteau", "Blancs en neige", "Pain/brioche", "Pétrin XL"],
  },
  Robot: {
    label: "Robot",
    icon: Disc,
    color: "text-green-600",
    bgColor: "bg-green-50",
    subModes: [],
  },
};

const CATEGORY_ICONS = {
  Tout: LayoutGrid,
  Apéritifs: Wine,
  Soupes: Soup,
  Entrées: Salad,
  Poissons: Fish,
  Viandes: UtensilsCrossed,
  Veggie: Leaf,
  "Pâtes, Riz, Pizza": Pizza,
  Légumes: Carrot,
  Sauces: Droplets,
  Boulangerie: Croissant,
  Desserts: Cake,
  Bébé: Baby,
  Boissons: Coffee,
  Glaces: IceCream,
};

// --- Configuration Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAUZtmNlePs-YiBP7M0_6r8os4XfLsT8So",
  authDomain: "magichef-a8329.firebaseapp.com",
  projectId: "magichef-a8329",
  storageBucket: "magichef-a8329.firebasestorage.app",
  messagingSenderId: "163582691950",
  appId: "1:163582691950:web:f0d48c1da9b0478b01747f",
  measurementId: "G-Z6YH63F8ZB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mon-magichef-v1";

export default function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [view, setView] = useState("list");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tout");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, "artifacts", appId, "public", "data", "recipes");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recipesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        recipesData.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setRecipes(recipesData);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleSaveRecipe = async (recipeData) => {
    if (!user) return;
    try {
      if (recipeData.id) {
        const recipeRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "recipes",
          recipeData.id
        );
        const { id, ...dataToUpdate } = recipeData;
        await updateDoc(recipeRef, {
          ...dataToUpdate,
          updatedAt: serverTimestamp(),
        });
        setSelectedRecipe({ ...selectedRecipe, ...dataToUpdate });
        setView("detail");
      } else {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "recipes"),
          {
            ...recipeData,
            userId: user.uid,
            createdAt: serverTimestamp(),
            favoritedBy: [],
          }
        );
        setView("list");
      }
    } catch (e) {
      alert("Erreur sauvegarde: " + e.message);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm("Supprimer cette recette ?")) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "recipes", id)
      );
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
        setView("list");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (e, recipe) => {
    e.stopPropagation();
    if (!user) return;
    const ref = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "recipes",
      recipe.id
    );
    const isFavorite = recipe.favoritedBy?.includes(user.uid);
    await updateDoc(ref, {
      favoritedBy: isFavorite ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch = r.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "Tout" || r.category === filterCategory;
    const matchesFavorite = showFavoritesOnly
      ? r.favoritedBy?.includes(user?.uid)
      : true;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20 md:pb-0">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setView("list");
              setShowFavoritesOnly(false);
            }}
          >
            <div className="bg-red-600 p-1.5 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Magi<span className="text-red-600">Chef</span>
            </h1>
          </div>
          {view === "list" && (
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setView("add");
              }}
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Créer</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {view === "list" && (
          <div className="space-y-6">
            <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-3 rounded-xl border transition flex items-center justify-center ${
                    showFavoritesOnly
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <Heart
                    size={24}
                    fill={showFavoritesOnly ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pl-1">
                {["Tout", ...CATEGORIES].map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] || ChefHat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                        filterCategory === cat
                          ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          filterCategory === cat
                            ? "text-red-500"
                            : "text-gray-400"
                        }
                      />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>
                    {showFavoritesOnly ? "Aucun favori." : "Aucune recette."}
                  </p>
                  {!showFavoritesOnly && (
                    <button
                      onClick={() => setView("add")}
                      className="text-red-600 font-medium mt-2"
                    >
                      Ajouter une recette
                    </button>
                  )}
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setView("detail");
                    }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group border border-gray-100 relative"
                  >
                    <div className="h-48 overflow-hidden relative bg-gray-200">
                      <img
                        src={
                          recipe.image ||
                          "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
                        {(() => {
                          const CatIcon =
                            CATEGORY_ICONS[recipe.category] || ChefHat;
                          return <CatIcon size={12} className="text-red-600" />;
                        })()}
                        {recipe.category}
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(e, recipe)}
                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md shadow-sm transition hover:scale-110 ${
                          recipe.favoritedBy?.includes(user?.uid)
                            ? "bg-red-500 text-white"
                            : "bg-white/90 text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          size={18}
                          fill={
                            recipe.favoritedBy?.includes(user?.uid)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} className="text-gray-400" />
                          {recipe.totalTime} min
                        </div>
                        <div className="flex items-center gap-1.5">
                          {recipe.servingsUnit === "pieces" ? (
                            <Cookie size={16} className="text-gray-400" />
                          ) : (
                            <Users size={16} className="text-gray-400" />
                          )}
                          {recipe.servings}{" "}
                          {recipe.servingsUnit === "pieces" ? "p." : "pers."}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === "detail" && selectedRecipe && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden animate-fade-in">
            <div className="relative h-64 md:h-80 bg-gray-200">
              <img
                src={
                  selectedRecipe.image ||
                  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80"
                }
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <button
                onClick={() => setView("list")}
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition text-gray-900 shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => handleToggleFavorite(e, selectedRecipe)}
                  className={`p-2.5 rounded-full backdrop-blur-md shadow-sm transition hover:scale-105 ${
                    selectedRecipe.favoritedBy?.includes(user?.uid)
                      ? "bg-red-500 text-white"
                      : "bg-white/90 text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={
                      selectedRecipe.favoritedBy?.includes(user?.uid)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
                <button
                  onClick={() => {
                    setView("edit");
                  }}
                  className="bg-white/90 backdrop-blur-md p-2.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition text-gray-900 shadow-sm"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                  className="bg-white/90 backdrop-blur-md p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 transition text-gray-900 shadow-sm"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                      {(() => {
                        const CatIcon =
                          CATEGORY_ICONS[selectedRecipe.category] || ChefHat;
                        return <CatIcon size={14} />;
                      })()}
                      {selectedRecipe.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {selectedRecipe.title}
                  </h2>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px] border border-gray-100">
                    <Timer className="text-gray-400 mb-1" size={20} />
                    <span className="font-bold text-gray-800 text-lg">
                      {selectedRecipe.prepTime || selectedRecipe.totalTime}
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase">
                      Prép.
                    </span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px] border border-gray-100">
                    <Clock className="text-red-500 mb-1" size={20} />
                    <span className="font-bold text-gray-800 text-lg">
                      {selectedRecipe.totalTime}
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase">
                      Total
                    </span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px] border border-gray-100">
                    {selectedRecipe.servingsUnit === "pieces" ? (
                      <Cookie className="text-gray-400 mb-1" size={20} />
                    ) : (
                      <Users className="text-gray-400 mb-1" size={20} />
                    )}
                    <span className="font-bold text-gray-800 text-lg">
                      {selectedRecipe.servings}
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase">
                      {selectedRecipe.servingsUnit === "pieces"
                        ? "Pièces"
                        : "Pers."}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-[1fr,1.5fr] gap-10">
                <div>
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg text-red-600">
                        <ChefHat size={20} />
                      </div>
                      Ingrédients
                    </h3>
                    <ul className="space-y-1">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li
                          key={idx}
                          className="flex items-baseline gap-3 py-0.5 text-gray-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 translate-y-0.5"></div>
                          <span className="leading-snug text-sm">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedRecipe.accessories &&
                    selectedRecipe.accessories.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Settings size={20} />
                          </div>
                          Accessoires
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipe.accessories.map((acc, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200"
                            >
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-800">
                      <Flame size={20} />
                    </div>
                    Préparation
                  </h3>
                  <div className="space-y-8">
                    {selectedRecipe.steps.map((step, idx) => {
                      const modeData = step.mode
                        ? ROBOT_MODES[step.mode]
                        : null;
                      const ModeIcon = modeData ? modeData.icon : null;
                      return (
                        <div
                          key={idx}
                          className="relative pl-8 border-l-2 border-gray-100 pb-2 last:border-0"
                        >
                          <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-gray-900 border-4 border-white shadow-sm flex items-center justify-center"></div>
                          <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Étape {idx + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                            {step.text}
                          </p>
                          {step.stepIngredients &&
                            step.stepIngredients.length > 0 && (
                              <div className="mb-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 block">
                                  Dans cette étape
                                </span>
                                <ul className="space-y-1">
                                  {step.stepIngredients.map((ing, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2 text-gray-700 text-sm"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></div>
                                      <span>{ing}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          {(modeData ||
                            step.speed ||
                            step.time ||
                            step.temp) && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              {modeData && (
                                <div className="mb-3">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${modeData.bgColor} ${modeData.color} font-bold text-sm border border-transparent`}
                                  >
                                    <ModeIcon size={18} />
                                    <span className="uppercase tracking-wide">
                                      {step.subMode || modeData.label}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                {step.time && (
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 font-medium border border-gray-200 shadow-sm">
                                    <Clock
                                      size={16}
                                      className="text-gray-400"
                                    />
                                    <span className="font-bold">
                                      {step.time}
                                    </span>{" "}
                                    <span className="text-xs text-gray-500 uppercase">
                                      min
                                    </span>
                                  </div>
                                )}
                                {step.speed && (
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 font-medium border border-gray-200 shadow-sm">
                                    <Wind size={16} className="text-gray-400" />
                                    <span className="text-xs text-gray-500 uppercase">
                                      Vit
                                    </span>{" "}
                                    <span className="font-bold">
                                      {step.speed}
                                    </span>
                                  </div>
                                )}
                                {step.temp && (
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 font-medium border border-gray-200 shadow-sm">
                                    <Flame
                                      size={16}
                                      className="text-gray-400"
                                    />
                                    <span className="font-bold">
                                      {step.temp}
                                    </span>{" "}
                                    <span className="text-xs text-gray-500">
                                      °C
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === "add" || view === "edit") && (
          <AddRecipeForm
            initialData={view === "edit" ? selectedRecipe : null}
            onCancel={() => setView(view === "edit" ? "detail" : "list")}
            onSave={handleSaveRecipe}
          />
        )}
      </main>
      {view === "list" && (
        <button
          onClick={() => {
            setSelectedRecipe(null);
            setView("add");
          }}
          className="md:hidden fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-xl hover:bg-red-700 transition z-50 flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

function AddRecipeForm({ initialData, onCancel, onSave }) {
  const defaultState = {
    title: "",
    category: "Apéritifs",
    image: "",
    servings: 4,
    servingsUnit: "personnes",
    prepTime: 15,
    totalTime: 30,
    ingredients: [""],
    accessories: [],
    steps: [
      {
        text: "",
        temp: "",
        speed: "",
        time: "",
        mode: "",
        subMode: "",
        stepIngredientsText: "",
      },
    ],
  };
  const [formData, setFormData] = useState({
    ...defaultState,
    ...initialData,
    steps: initialData
      ? initialData.steps.map((s) => ({
          ...s,
          stepIngredientsText: s.stepIngredients
            ? s.stepIngredients.join("\n")
            : "",
        }))
      : defaultState.steps,
  });
  const isEditing = !!initialData;

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleIngredientChange = (idx, value) => {
    const newIng = [...formData.ingredients];
    newIng[idx] = value;
    setFormData((prev) => ({ ...prev, ingredients: newIng }));
  };
  const addIngredient = () =>
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ""],
    }));
  const removeIngredient = (idx) =>
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  const toggleAccessory = (acc) =>
    setFormData((prev) => {
      const current = prev.accessories || [];
      return current.includes(acc)
        ? { ...prev, accessories: current.filter((a) => a !== acc) }
        : { ...prev, accessories: [...current, acc] };
    });

  const handleStepChange = (idx, field, value) => {
    const newSteps = [...formData.steps];
    if (field === "mode") {
      const modeData = ROBOT_MODES[value];
      newSteps[idx] = {
        ...newSteps[idx],
        mode: value,
        subMode:
          modeData && modeData.subModes.length > 0 ? modeData.subModes[0] : "",
      };
    } else {
      newSteps[idx] = { ...newSteps[idx], [field]: value };
    }
    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };
  const addStep = () =>
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          text: "",
          temp: "",
          speed: "",
          time: "",
          mode: "",
          subMode: "",
          stepIngredientsText: "",
        },
      ],
    }));
  const removeStep = (idx) =>
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx),
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanData = {
      ...formData,
      ingredients: formData.ingredients.filter((i) => i.trim() !== ""),
      steps: formData.steps
        .map((s) => ({
          ...s,
          stepIngredients: s.stepIngredientsText
            ? s.stepIngredientsText
                .split("\n")
                .filter((line) => line.trim() !== "")
            : [],
        }))
        .filter((s) => s.text.trim() !== ""),
    };
    cleanData.steps.forEach((s) => delete s.stepIngredientsText);
    if (!cleanData.title) return alert("Titre requis");
    onSave(cleanData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Modifier" : "Nouvelle Recette"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronLeft size={20} className="-rotate-90" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  value={formData.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "image",
                      `https://source.unsplash.com/800x600/?${formData.title}`
                    )
                  }
                  className="bg-gray-100 p-3 rounded-xl hover:bg-gray-200 text-gray-600"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prép (min)
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                value={formData.prepTime}
                onChange={(e) =>
                  handleChange("prepTime", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total (min)
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                value={formData.totalTime}
                onChange={(e) =>
                  handleChange("totalTime", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-20 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.servings}
                  onChange={(e) =>
                    handleChange("servings", parseInt(e.target.value) || 0)
                  }
                />
                <select
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.servingsUnit}
                  onChange={(e) => handleChange("servingsUnit", e.target.value)}
                >
                  {SERVING_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3 border-b pb-2">Ingrédients</h3>
          <div className="space-y-2">
            {formData.ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Ingrédient ${idx + 1}`}
                  value={ing}
                  onChange={(e) => handleIngredientChange(idx, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 mt-2 px-1"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3 border-b pb-2">Accessoires</h3>
          <div className="flex flex-wrap gap-2">
            {MAGIMIX_ACCESSORIES.map((acc) => {
              const isSelected = formData.accessories?.includes(acc);
              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleAccessory(acc)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={14} />}
                  {acc}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3 border-b pb-2">Préparation</h3>
          <div className="space-y-6">
            {formData.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-4 rounded-xl relative group border border-transparent focus-within:border-gray-200 focus-within:bg-white transition shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    ÉTAPE {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Instructions
                  </label>
                  <textarea
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none resize-none h-24 focus:ring-2 focus:ring-gray-200 transition"
                    value={step.text}
                    onChange={(e) =>
                      handleStepChange(idx, "text", e.target.value)
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Ingrédients étape (un/ligne)
                  </label>
                  <textarea
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none resize-none h-20 focus:ring-2 focus:ring-orange-200 text-sm"
                    value={step.stepIngredientsText}
                    onChange={(e) =>
                      handleStepChange(
                        idx,
                        "stepIngredientsText",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Mode
                    </label>
                    <select
                      className="w-full p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none"
                      value={step.mode}
                      onChange={(e) =>
                        handleStepChange(idx, "mode", e.target.value)
                      }
                    >
                      <option value="">Aucun</option>
                      {Object.keys(ROBOT_MODES).map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                  {step.mode && ROBOT_MODES[step.mode]?.subModes.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Programme
                      </label>
                      <select
                        className="w-full p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none"
                        value={step.subMode}
                        onChange={(e) =>
                          handleStepChange(idx, "subMode", e.target.value)
                        }
                      >
                        {ROBOT_MODES[step.mode].subModes.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Clock
                      size={14}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full pl-9 p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-red-300"
                      value={step.time}
                      onChange={(e) =>
                        handleStepChange(idx, "time", e.target.value)
                      }
                    />
                  </div>
                  <div className="relative">
                    <Wind
                      size={14}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Vit"
                      className="w-full pl-9 p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                      value={step.speed}
                      onChange={(e) =>
                        handleStepChange(idx, "speed", e.target.value)
                      }
                    />
                  </div>
                  <div className="relative">
                    <Flame
                      size={14}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="°C"
                      className="w-full pl-9 p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-orange-300"
                      value={step.temp}
                      onChange={(e) =>
                        handleStepChange(idx, "temp", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-red-500 hover:text-red-500 hover:bg-red-50 flex justify-center items-center gap-2"
            >
              <Plus size={20} /> Nouvelle étape
            </button>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg flex justify-center items-center gap-2"
          >
            <Save size={20} /> {isEditing ? "Mettre à jour" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
