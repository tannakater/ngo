import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNgoStore, Project } from '../../store/useNgoStore';
import { 
  Briefcase, Search, MapPin, DollarSign, CheckCircle, 
  ArrowRight, Heart, Filter, Layers, Eye, X, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Programs() {
  const { projects } = useNgoStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = ['All', 'Water & Sanitation', 'Education', 'Healthcare', 'Environment', 'Disaster Relief'];

  const filteredProjects = projects.filter(project => {
    const matchesCat = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            Our Sustainable Impact
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4 mb-3">
            Humanitarian Programs & Initiatives
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Engineered with local communities for long-term self-sufficiency. Explore our active and completed fieldwork projects.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs mb-10 flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* Programs Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs"
          >
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No programs match your search</h3>
            <p className="text-sm text-slate-500 mt-1">Try selecting a different category or clearing search keywords.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredProjects.map((proj, idx) => (
                <motion.div 
                  key={proj.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img 
                        src={proj.coverImage} 
                        alt={proj.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {proj.category || 'General Aid'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                          proj.status === 'Completed' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{proj.location}</span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                        {proj.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                        {proj.description}
                      </p>

                      {/* Progress & Budget */}
                      <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Completion Progress</span>
                          <span className="text-emerald-700">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${proj.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              proj.progress === 100 ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                          <span>Total Allocation</span>
                          <span className="font-bold text-slate-900">${proj.budget.toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 pt-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <Link
                      to={`/donate`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" /> Support
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
            >
              <div className="relative h-64 bg-slate-100 shrink-0">
                <img src={selectedProject.coverImage} alt={selectedProject.title} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full transition-colors cursor-pointer shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                    {selectedProject.status}
                  </span>
                  <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {selectedProject.category || 'General'}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Location: {selectedProject.location}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">{selectedProject.title}</h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 whitespace-pre-line font-normal">
                  {selectedProject.description}
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 mb-6 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Project Budget:</span>
                    <span className="font-bold text-slate-900">${selectedProject.budget.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Execution Progress:</span>
                    <span className="font-bold text-emerald-700">{selectedProject.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                      style={{ width: `${selectedProject.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    to="/donate"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-current" /> Sponsor this Project
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
